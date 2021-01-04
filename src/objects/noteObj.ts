import { Note } from "./fluidObject";

export class NoteObj {
    public text : string;
    public id : string;

    public getText = (NoteObj) => {
        return NoteObj.text;
    }
}