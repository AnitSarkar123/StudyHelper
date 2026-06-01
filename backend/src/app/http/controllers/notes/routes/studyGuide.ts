import { Router } from "express"
import { getStudyGuide } from "../studyGuide/getStudyGuide"
import { UpdateOrCreateStudyGuide } from "../studyGuide/UpdateOrCreateStudyGuide"

export function getStudyGuideRoute(router: Router){

    router.get('/notes/StudyGuide', getStudyGuide)
    router.put('/notes/StudyGuide', UpdateOrCreateStudyGuide)
    return router
}