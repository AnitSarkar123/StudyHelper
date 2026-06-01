import { Router } from "express"
import { getBriefingDoc } from "../brifingDoc/getBrifingDoc"
import { UpdateOrCreateBrifingDoc } from "../brifingDoc/UpdateOrCreateBrifingDoc"

export function getBriefingDocRoute(router: Router){

    router.get('/notes/BriefingDoc', getBriefingDoc)
    router.put('/notes/BriefingDoc', UpdateOrCreateBrifingDoc)
    return router
}