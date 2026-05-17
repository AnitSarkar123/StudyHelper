
import { Document } from "@langchain/core/documents"
export function reciprocalRankFusion(results:Document[][], k=60 ){
    const fusedScore =new Map()
    for(const docs of results){
        docs.forEach((doc,rank)=>{
            const key = doc.pageContent
            const previousScore = fusedScore.get(key) || 0;
            fusedScore.set(key,previousScore+1/(rank+k));
        })


    }
    const reranked =Array.from(fusedScore.entries())
        .map(([key,score])=>{
            const doc =results.flat().find(d => d.pageContent === key);
            return {doc,score}
        })
        .sort((a,b)=>b.score-a.score)

    return reranked;
    
}
