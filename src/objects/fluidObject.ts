import {
    DataObject,
    DataObjectFactory,
} from "@fluidframework/aqueduct";
import { SharedMap } from "@fluidframework/map";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { NoteObj } from "./noteObj";


export class Note extends DataObject {
   public notesMap : SharedMap;

   protected async initializingFirstTime() {
        this.createSharedMap("notes"); 
  
    }

    private createSharedMap(id: string): void {
        const map = SharedMap.create(this.runtime);
        this.root.set(id, map.handle);
    }

    protected async hasInitialized() {
        this.notesMap = await this.root.get<IFluidHandle<SharedMap>>("notes").get();              
        this.createNote("Note1")
        this.notesMap.forEach((i:Note) => {
            console.log("YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY" + this.notesMap.get("id").text)

        })
        this.createEventListeners(this.notesMap);
    }
    private createEventListeners(sharedMap: SharedMap): void {
        sharedMap.on("valueChanged", () => {
            this.emit("change");
        });
    }
    public createNote = (text: string): void => {
        if (text) {
            let obj = new NoteObj();
            obj.text = "text with";
            obj.id = "id"
            // const note =  {
            //     text: "text of notes",
            //     id : "1"
            // };
            this.notesMap.set(obj.id, obj);
        }
    }
}

export const NotesInstantiationFactory = new DataObjectFactory(
    "Note",
    Note,
    [
        SharedMap.getFactory(),
    ],
    {},
);
  