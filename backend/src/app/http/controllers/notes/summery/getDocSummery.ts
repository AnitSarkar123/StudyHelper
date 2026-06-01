import express from 'express'
import { Express, NextFunction, Response, Request } from "express";
import { DocRepository } from '../repository/DocRepository';

export async function getDocSummary(req: Request, res: Response, next: NextFunction) {
    try {
        const {userId, noteId}:Record<string,any> = req.query
        const docRepo = DocRepository.getInstance()
        const doc = await docRepo.getSingleDoc({userId, noteId})
        if(!doc) throw new Error('No document found')

        return res.status(200).send({summary:doc?.summary})
    } catch (error) {
        next(error)
    }
}