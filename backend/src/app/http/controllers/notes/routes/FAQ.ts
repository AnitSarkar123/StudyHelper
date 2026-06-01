import { Router } from "express"
import { UpdateOrCreateFAQ } from "../faq/UpdateOrCreateFAQ"
import { getFAQ } from "../faq/getFAQ"

export function getFAQRoute(router: Router){

    router.get('/notes/faq', getFAQ)
    router.put('/notes/faq', UpdateOrCreateFAQ)
    return router
}