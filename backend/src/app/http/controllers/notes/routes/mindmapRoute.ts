import { Router } from "express"
import { getBriefingDoc } from "../brifingDoc/getBrifingDoc"
import { UpdateOrCreateBrifingDoc } from "../brifingDoc/UpdateOrCreateBrifingDoc"
import { getMindMap } from "../mindmap/getMindMap"
import {CreateOrUpdateMindMap} from "../mindmap/createOrUpdateMindMap"
export function getMindmapRoute(router: Router){

    router.get('/notes/mindmap', getMindMap)
    router.put('/notes/mindmap', CreateOrUpdateMindMap)
    return router
}