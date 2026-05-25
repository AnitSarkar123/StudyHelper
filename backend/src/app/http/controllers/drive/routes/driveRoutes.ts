import {Router} from "express"

import { getUserDriveFiles } from "../getUserDriveFiles"

// const router = Router()

export function driveRoutes(router: Router) {
    router.get("/users/files", getUserDriveFiles)
    return router
}