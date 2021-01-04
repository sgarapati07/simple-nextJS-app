/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// import { getDefaultObjectFromContainer } from "@fluidframework/aqueduct";
// import { getTinyliciousContainer } from "@fluidframework/get-tinylicious-container";
import { Container } from "@fluidframework/container-loader";
import { Note } from "../objects/fluidObject";
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
let container: Container | undefined;
let defaultObject = undefined;

export async function loadContainer() {
        try {
            console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")


            // We need some way of knowing if this document has been created before
            // so we will use local storage as our source of truth
            // let documentId = window.localStorage.getItem(storageKey);
            let documentId = "123"

            const isNew = documentId === null;
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
            if (isNew) {
                documentId = Date.now().toString()
                window.localStorage.setItem(storageKey, documentId);
            }
            // const container = await getTinyliciousContainer(
            //     documentId,
            //     DocumentManagerContainer,
            //     isNew
            // );
            if (isNew) {
                container = await loader.createDetachedContainer(details);
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
