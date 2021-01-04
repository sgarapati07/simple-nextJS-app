import { ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";

import {NotesInstantiationFactory} from "../objects/fluidObject";

export const NotesContainerFactory = new ContainerRuntimeFactoryWithDefaultDataStore(
    NotesInstantiationFactory,
    new Map([NotesInstantiationFactory.registryEntry])
  );