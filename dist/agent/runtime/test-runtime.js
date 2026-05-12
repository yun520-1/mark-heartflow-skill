"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Runtime 集成测试
 */
const index_1 = require("./index");
void (async () => {
    // Test 1: TaskGraph
    console.log('=== TaskGraph Test ===');
    const graph = new index_1.TaskGraph({ name: 'test-graph' });
    graph.addNode('a', 'Task A', { data: 1 });
    graph.addNode('b', 'Task B', { data: 2 }, ['a']);
    graph.addNode('c', 'Task C', { data: 3 }, ['a']);
    graph.addNode('d', 'Task D', { data: 4 }, ['b', 'c']);
    console.log('Layers:', JSON.stringify(graph.getExecutionLayers()));
    console.log('Topo order:', graph.printOrder());
    console.log('Has cycle:', graph.detectCycle().hasCycle);
    console.log('Summary:', graph.toSummaryString());
    console.log('✓ TaskGraph OK\n');
    // Test 2: TaskScheduler
    console.log('=== TaskScheduler Test ===');
    const graph2 = new index_1.TaskGraph({ name: 'test-scheduler' });
    graph2.addNode('step1', 'Load Data', { source: 'db' });
    graph2.addNode('step2', 'Process', { transform: 'uppercase' }, ['step1']);
    graph2.addNode('step3', 'Save', { dest: 'file' }, ['step2']);
    graph2.addNode('parallel1', 'Task X', { x: 1 }, ['step1']);
    graph2.addNode('parallel2', 'Task Y', { y: 2 }, ['step1']);
    const scheduler = new index_1.TaskScheduler({
        graph: graph2,
        maxConcurrency: 2,
        executor: async (node) => {
            console.log(`[EXEC] ${node.label}`);
            await new Promise(r => setTimeout(r, 50));
            return { done: true };
        },
        events: {
            onTaskComplete: (node) => console.log(`[DONE] ${node.label}`),
            onGraphComplete: () => console.log('[FINAL] Graph complete!'),
        },
        autoStart: false,
    });
    const result = await scheduler.run();
    console.log('Result:', result);
    console.log('✓ Scheduler OK\n');
    // Test 3: AgentRuntime workflow helpers
    console.log('=== AgentRuntime Test ===');
    const runtime = new index_1.AgentRuntime({ name: 'TestRuntime' });
    const workflow = index_1.AgentRuntime.createDAGWorkflow('wf1', 'My Workflow', [
        { id: 'fetch', label: 'Fetch', payload: { url: '...' }, deps: ['clean'] },
        { id: 'clean', label: 'Clean', payload: { format: 'csv' } },
        { id: 'save', label: 'Save', payload: { path: '/tmp/out' }, deps: ['fetch'] },
    ]);
    runtime.registerWorkflow(workflow);
    console.log('Registered workflow:', runtime.getGraph('wf1')?.toSummaryString());
    runtime.on('task_complete', (e) => {
        console.log(`[EVENT] task_complete: ${e.nodeId}`);
    });
    runtime.on('heartbeat', (e) => {
        console.log(`[HEARTBEAT] uptime: ${e.payload.uptime}ms`);
    });
    const execResult = await runtime.execute('wf1', async (node) => {
        console.log(`Executing ${node.label}...`);
        await new Promise(r => setTimeout(r, 30));
        return { result: node.payload };
    });
    console.log('Execution result:', execResult);
    console.log('✓ AgentRuntime OK');
    runtime.shutdown();
    console.log('\n✅ All tests passed!');
})();
//# sourceMappingURL=test-runtime.js.map