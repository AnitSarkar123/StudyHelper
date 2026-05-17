import { END, START, StateGraph, Annotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
    // 1. It allows to know on which node we are
    // 2. we can use a state to know value inside of it
    currentNode: Annotation<string>({
        default: () => "",
        reducer: (previousVal, nextVal) => previousVal ? previousVal : nextVal
    })
    ,
    nextNode: Annotation<string>({
        default: () => "",
        reducer: (previousVal, nextVal) => previousVal ? previousVal : nextVal
    }),
    users: Annotation<string[]>({
        default: () => [],
        reducer: (previousVal, nextVal) => {

            return previousVal.concat(nextVal)
        }

    }),

    aggregate: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
    })
});

// Create the graph
const nodeA = (state: typeof StateAnnotation.State) => {
console.log('node A')

    return { users: [`chris`] };
};
const nodeB = (state: typeof StateAnnotation.State) => {
console.log('node B')
    return { users: [`crish`] };
};
const nodeC = (state: typeof StateAnnotation.State) => {
console.log('node C')
    return { users: [`Isaac`] };
};

const nodeD = (state: typeof StateAnnotation.State) => {
    console.log('node D')
    return { users: [`Isaac`] };
};


const router = (state: typeof StateAnnotation.State) => {

    if(state.users.includes('john')){
        return 'b'
    }
    if(state.users.includes('chris')){
        return "c"
    }
    return "__end__"
};






const builder = new StateGraph(StateAnnotation)

    .addNode("a", nodeA)

    .addNode("b", nodeB)
    .addNode("c", nodeC)
    .addNode("d", nodeD)

    .addEdge(START, "a")
    .addConditionalEdges('a',router)
    // .addEdge("a", "b")
    // .addEdge("b", "c")
    // 
    .addEdge("b", 'd')
    .addEdge("c", 'd')
    .addEdge("d", END);



const graph = builder.compile();
// Invoke the graph
const baseResult = await graph.invoke({ aggregate: [], users: [] });
// console.log("Base Result: ", baseResult);