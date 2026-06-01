import { Router } from "express"
import { UpdateOrCreateSummary } from "../summery/UpdateOrcreateSummary"
import { getDocSummary } from "../summery/getDocSummery"
export function getSummaryRoute(router: Router){

    router.get('/notes/summary', getDocSummary)
    router.put('/notes/summary', UpdateOrCreateSummary)
    return router
}