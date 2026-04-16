#!/usr/bin/env python3
"""
Ontology Graph Engine - 结构化知识图谱引擎

集成到 HeartFlow v9.1.0
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import argparse

# 默认存储路径
DEFAULT_GRAPH_PATH = "memory/ontology/graph.jsonl"
DEFAULT_SCHEMA_PATH = "memory/ontology/schema.yaml"


def generate_id(type_name: str) -> str:
    """Generate a unique ID for an entity."""
    prefix = type_name.lower()[:4]
    suffix = uuid.uuid4().hex[:8]
    return f"{prefix}_{suffix}"


def resolve_path(path: str, root: Path = None) -> Path:
    """Resolve path within root."""
    safe_root = (root or Path.cwd()).resolve()
    candidate = Path(path).expanduser()
    if not candidate.is_absolute():
        candidate = safe_root / candidate
    return candidate.resolve()


def load_graph(graph_path: str) -> tuple[dict, list]:
    """Load entities and relations from graph file."""
    entities = {}
    relations = []
    
    path = Path(graph_path)
    if not path.exists():
        return entities, relations
    
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            op = record.get("op")
            
            if op == "create":
                entity = record["entity"]
                entities[entity["id"]] = entity
            elif op == "update":
                entity_id = record["id"]
                if entity_id in entities:
                    entities[entity_id]["properties"].update(record.get("properties", {}))
                    entities[entity_id]["updated"] = record.get("timestamp")
            elif op == "delete":
                entity_id = record["id"]
                entities.pop(entity_id, None)
            elif op == "relate":
                relations.append({
                    "from": record["from"],
                    "rel": record["rel"],
                    "to": record["to"],
                    "properties": record.get("properties", {})
                })
    
    return entities, relations


def append_op(graph_path: str, record: dict):
    """Append an operation to the graph file."""
    path = Path(graph_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "a") as f:
        f.write(json.dumps(record) + "\n")


class OntologyEngine:
    """知识图谱引擎"""
    
    def __init__(self, graph_path: str = None, schema_path: str = None):
        self.graph_path = graph_path or DEFAULT_GRAPH_PATH
        self.schema_path = schema_path or DEFAULT_SCHEMA_PATH
    
    # === 实体操作 ===
    
    def create(self, type_name: str, properties: dict, entity_id: str = None) -> dict:
        """创建实体"""
        entity_id = entity_id or generate_id(type_name)
        timestamp = datetime.now(timezone.utc).isoformat()
        
        entity = {
            "id": entity_id,
            "type": type_name,
            "properties": properties,
            "created": timestamp,
            "updated": timestamp
        }
        
        record = {"op": "create", "entity": entity, "timestamp": timestamp}
        append_op(self.graph_path, record)
        
        return entity
    
    def get(self, entity_id: str) -> Optional[dict]:
        """获取实体"""
        entities, _ = load_graph(self.graph_path)
        return entities.get(entity_id)
    
    def update(self, entity_id: str, properties: dict) -> Optional[dict]:
        """更新实体"""
        entities, _ = load_graph(self.graph_path)
        if entity_id not in entities:
            return None
        
        timestamp = datetime.now(timezone.utc).isoformat()
        record = {"op": "update", "id": entity_id, "properties": properties, "timestamp": timestamp}
        append_op(self.graph_path, record)
        
        entities[entity_id]["properties"].update(properties)
        entities[entity_id]["updated"] = timestamp
        return entities[entity_id]
    
    def delete(self, entity_id: str) -> bool:
        """删除实体"""
        entities, _ = load_graph(self.graph_path)
        if entity_id not in entities:
            return False
        
        timestamp = datetime.now(timezone.utc).isoformat()
        record = {"op": "delete", "id": entity_id, "timestamp": timestamp}
        append_op(self.graph_path, record)
        return True
    
    def query(self, type_name: str = None, where: dict = None) -> list:
        """查询实体"""
        entities, _ = load_graph(self.graph_path)
        results = []
        
        for entity in entities.values():
            if type_name and entity["type"] != type_name:
                continue
            
            if where:
                match = True
                for key, value in where.items():
                    if entity["properties"].get(key) != value:
                        match = False
                        break
                if not match:
                    continue
            
            results.append(entity)
        
        return results
    
    def list_all(self, type_name: str = None) -> list:
        """列出所有实体"""
        return self.query(type_name)
    
    # === 关系操作 ===
    
    def relate(self, from_id: str, rel_type: str, to_id: str, properties: dict = None) -> dict:
        """创建关系"""
        timestamp = datetime.now(timezone.utc).isoformat()
        record = {
            "op": "relate",
            "from": from_id,
            "rel": rel_type,
            "to": to_id,
            "properties": properties or {},
            "timestamp": timestamp
        }
        append_op(self.graph_path, record)
        return record
    
    def get_related(self, entity_id: str, rel_type: str = None, direction: str = "outgoing") -> list:
        """获取相关实体"""
        entities, relations = load_graph(self.graph_path)
        results = []
        
        for rel in relations:
            if direction == "outgoing" and rel["from"] == entity_id:
                if not rel_type or rel["rel"] == rel_type:
                    if rel["to"] in entities:
                        results.append({
                            "relation": rel["rel"],
                            "direction": "outgoing",
                            "entity": entities[rel["to"]]
                        })
            elif direction == "incoming" and rel["to"] == entity_id:
                if not rel_type or rel["rel"] == rel_type:
                    if rel["from"] in entities:
                        results.append({
                            "relation": rel["rel"],
                            "direction": "incoming",
                            "entity": entities[rel["from"]]
                        })
        
        return results
    
    # === 验证 ===
    
    def validate(self) -> list:
        """验证图谱约束"""
        entities, relations = load_graph(self.graph_path)
        errors = []
        
        # 基础验证：检查关系引用
        for rel in relations:
            if rel["from"] not in entities:
                errors.append(f"Relation references missing entity: {rel['from']}")
            if rel["to"] not in entities:
                errors.append(f"Relation references missing entity: {rel['to']}")
        
        # 检查环（对于 blocks 关系）
        block_rels = [r for r in relations if r["rel"] == "blocks"]
        if block_rels:
            graph = {}
            for rel in block_rels:
                graph.setdefault(rel["from"], []).append(rel["to"])
            
            visited = {}
            
            def has_cycle(node, stack):
                visited[node] = True
                stack.add(node)
                for nxt in graph.get(node, []):
                    if nxt in stack:
                        return True
                    if not visited.get(nxt, False):
                        if has_cycle(nxt, stack):
                            return True
                stack.remove(node)
                return False
            
            for node in graph:
                if not visited.get(node, False):
                    if has_cycle(node, set()):
                        errors.append("Cyclic dependency detected in blocks relation")
                        break
        
        return errors
    
    # === 统计 ===
    
    def stats(self) -> dict:
        """获取图谱统计"""
        entities, relations = load_graph(self.graph_path)
        
        type_counts = {}
        for entity in entities.values():
            t = entity["type"]
            type_counts[t] = type_counts.get(t, 0) + 1
        
        rel_counts = {}
        for rel in relations:
            r = rel["rel"]
            rel_counts[r] = rel_counts.get(r, 0) + 1
        
        return {
            "total_entities": len(entities),
            "total_relations": len(relations),
            "by_type": type_counts,
            "by_relation": rel_counts
        }


# === CLI ===

def main():
    parser = argparse.ArgumentParser(description="Ontology Graph Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Create
    create_p = subparsers.add_parser("create", help="Create entity")
    create_p.add_argument("--type", "-t", required=True, help="Entity type")
    create_p.add_argument("--props", "-p", default="{}", help="Properties JSON")
    create_p.add_argument("--id", help="Entity ID (auto-generated if not provided)")
    
    # Get
    get_p = subparsers.add_parser("get", help="Get entity by ID")
    get_p.add_argument("--id", required=True, help="Entity ID")
    
    # Query
    query_p = subparsers.add_parser("query", help="Query entities")
    query_p.add_argument("--type", "-t", help="Entity type")
    query_p.add_argument("--where", "-w", default="{}", help="Filter JSON")
    
    # List
    list_p = subparsers.add_parser("list", help="List entities")
    list_p.add_argument("--type", "-t", help="Entity type")
    
    # Relate
    relate_p = subparsers.add_parser("relate", help="Create relation")
    relate_p.add_argument("--from", dest="from_id", required=True)
    relate_p.add_argument("--rel", "-r", required=True)
    relate_p.add_argument("--to", dest="to_id", required=True)
    relate_p.add_argument("--props", "-p", default="{}")
    
    # Related
    related_p = subparsers.add_parser("related", help="Get related entities")
    related_p.add_argument("--id", required=True)
    related_p.add_argument("--rel", "-r")
    related_p.add_argument("--dir", "-d", choices=["outgoing", "incoming", "both"], default="outgoing")
    
    # Validate
    subparsers.add_parser("validate", help="Validate graph")
    
    # Stats
    subparsers.add_parser("stats", help="Show statistics")
    
    args = parser.parse_args()
    
    engine = OntologyEngine()
    
    if args.command == "create":
        props = json.loads(args.props)
        entity = engine.create(args.type, props, args.id)
        print(json.dumps(entity, indent=2, ensure_ascii=False))
    
    elif args.command == "get":
        entity = engine.get(args.id)
        print(json.dumps(entity, indent=2, ensure_ascii=False) if entity else "Entity not found")
    
    elif args.command == "query":
        where = json.loads(args.where) if args.where != "{}" else None
        results = engine.query(args.type, where)
        print(json.dumps(results, indent=2, ensure_ascii=False))
    
    elif args.command == "list":
        results = engine.list_all(args.type)
        print(json.dumps(results, indent=2, ensure_ascii=False))
    
    elif args.command == "relate":
        props = json.loads(args.props)
        record = engine.relate(args.from_id, args.rel, args.to_id, props)
        print(json.dumps(record, indent=2))
    
    elif args.command == "related":
        results = engine.get_related(args.id, args.rel, args.dir)
        print(json.dumps(results, indent=2, ensure_ascii=False))
    
    elif args.command == "validate":
        errors = engine.validate()
        if errors:
            print("Validation errors:")
            for e in errors:
                print(f"  - {e}")
        else:
            print("✓ Graph is valid")
    
    elif args.command == "stats":
        stats = engine.stats()
        print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()