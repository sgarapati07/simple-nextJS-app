import { Injectable } from '@nestjs/common';
import { getDefaultObjectFromContainer } from '@fluidframework/aqueduct';
import { getTinyliciousContainer } from '@fluidframework/get-tinylicious-container';
import { NotesContainerFactory } from '../containers/notesContainer';
import { Note } from '../objects/fluidObject';
import { loadContainer } from 'src/containers/nodeLoaderContainer';


import { Container } from "@fluidframework/container-loader";
// import { DocumentManagerContainer } from "../containers";

import { ITokenClaims, IUser } from "@fluidframework/protocol-definitions";
import * as jwt from "jsonwebtoken";
import { IFluidResolvedUrl } from "@fluidframework/driver-definitions";
import * as url from "url";
// import { ContainerUrlResolver } from "@fluidframework/routerlicious-host";
import { NodeCodeLoader } from "../nodecodeloader/nodeCodeloader";
import { InsecureTokenProvider} from "@fluidframework/test-runtime-utils";
import { Loader } from "@fluidframework/container-loader";
import { RouterliciousDocumentServiceFactory } from "@fluidframework/routerlicious-driver";
import { IFluidCodeDetails } from "@fluidframework/core-interfaces";
import { fetchFluidObject } from "../nodecodeloader/fetchFluidObject";
import { ContainerUrlResolver } from "@fluidframework/routerlicious-host";
import { Console } from "console";

@Injectable()
export class ItemsService {
    getItems(): Promise<void> {
        // return this.getNotesFromContainer()
        return this.loadContainer()
        
      }
    
    //   public async getNotesFromContainer() {
    //     const documentId = "DOC28";
    //         const createNew = true;
    // const container = await getTinyliciousContainer(documentId, NotesContainerFactory, createNew);
    //     // if (container !== undefined) {
    //     //     container.close();
    //     // }
    //     // const dummy =     await loadContainer();
    //     // console.log("ZZZZZZZZZZZZZZZZZZZZZZ" + dummy)
        
    //     // Get the Default Object from the Container
    //     const defaultObject = await getDefaultObjectFromContainer<Note>(container);
    //     console.log( "XXXXXXXXXXXXXXXXXXXXXXX" + defaultObject.);
    //   }
    
   
    public async loadContainer() {
        const storageKey = "notes-key";
    const ordererEndpoint = "http://localhost:3000";
    const storageEndpoint = "http://localhost:3000";
    const tenantId = "tinylicious";
    const tenantKey = "12345";
    const bearerSecret = "12345";
    
    const defaultPackage = "@fluid-example/simple-app@0.0.1";
    const installPath = "/tmp/fluid-objects";
    const timeoutMS = 60000;
    
    const user = {
        id: "node-user",         // Required value
        name: "Node User",       // Optional value that we included
    } as IUser;
    
        let container : Container | undefined;
        let defaultObject = undefined;
        try {


            // We need some way of knowing if this document has been created before
            // so we will use local storage as our source of truth
            // let documentId = window.localStorage.getItem(storageKey);
            let documentId = "doc30"
            const isNew = true
            const hostToken = jwt.sign(
                {
                    user,
                },
                bearerSecret);

            const claims: ITokenClaims = {
                documentId,
                scopes: ["doc:read", "doc:write", "summary:write"],
                tenantId,
                user,
                iat: Math.round(new Date().getTime() / 1000),
                exp: Math.round(new Date().getTime() / 1000) + 60 * 60, // 1 hour expiration
                ver: "1.0",
             };
            const token = jwt.sign(claims, tenantKey);
            const encodedTenantId = encodeURIComponent(tenantId);
            const encodedDocId = encodeURIComponent(documentId);
            const documentUrl = `fluid://${url.parse(ordererEndpoint).host}/${encodedTenantId}/${encodedDocId}`;
            const deltaStorageUrl = `${ordererEndpoint}/deltas/${encodedTenantId}/${encodedDocId}`;
            const storageUrl = `${storageEndpoint}/repos/${encodedTenantId}`;
            const requestUrl = `http://${url.parse(ordererEndpoint).host}/${encodedTenantId}/${encodedDocId}`;
            const resolved: IFluidResolvedUrl = {
                endpoints: {
                    deltaStorageUrl,
                    ordererUrl: ordererEndpoint,
                    storageUrl,
                },
                tokens: { jwt: token },
                type: "fluid",
                url: documentUrl,
            };
        
            const urlResolver = new ContainerUrlResolver(
                ordererEndpoint,
                hostToken,
                new Map([[requestUrl, resolved]]));

            const codeLoader = new NodeCodeLoader(installPath, timeoutMS);
            const tokenProvider = new InsecureTokenProvider(tenantId, documentId,tenantKey, user);

            
        
            
            const loader = new Loader({
                urlResolver,
                documentServiceFactory: new RouterliciousDocumentServiceFactory(tokenProvider),
                codeLoader,
            });

        
            const details: IFluidCodeDetails = {
                config: {},
                package: defaultPackage,
            };
            // if (isNew) {
            //     documentId = Date.now().toString()
            //     window.localStorage.setItem(storageKey, documentId);
            // }
            // const container = await getTinyliciousContainer(
            //     documentId,
            //     DocumentManagerContainer,
            //     isNew
            // );
            if (isNew) {
                container = await loader.createDetachedContainer(details);
                console.log("cccccccccccccccccc" + container.id)
                await container.attach({ url: requestUrl });
            } else {
                container = await loader.resolve({ url: requestUrl });
            }

            // defaultObject = await getDefaultObjectFromContainer<DocumentManager>(container);
            defaultObject = await fetchFluidObject(loader, container, requestUrl);

        } catch (e) {
            // Something went wrong
            // Navigate to Error page
        }
    }
}
