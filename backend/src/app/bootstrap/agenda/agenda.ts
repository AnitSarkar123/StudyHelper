// jobs/agenda.ts
import { Agenda } from "agenda";
import { MongoBackend } from "@agendajs/mongo-backend";

const agenda = new Agenda({
  backend: new MongoBackend({
    address: process.env.MONGODB_CONNECTION_STRING as string,
    collection: "jobs"
  }),
});

export default agenda;