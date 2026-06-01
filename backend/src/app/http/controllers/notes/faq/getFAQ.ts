import { Express, NextFunction, Response, Request } from "express";
import { DocRepository } from "../repository/DocRepository";

export async function getFAQ(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, noteId }: Record<string, any> = req.query;
    const docRepo = DocRepository.getInstance();
    const doc = await docRepo.getSingleDoc({ userId, noteId });

    if (!doc) {
      throw new Error('No document found');
    }

    return res.status(200).send({ faq: doc?.FAQ });
  } catch (error) {
    next(error);
  }
}