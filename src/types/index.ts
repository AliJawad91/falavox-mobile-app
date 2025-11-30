export * from './api';

// Root state that includes both counter and auth
import { RootState as StoreRootState} from '../store/index.ts';

export type RootState = StoreRootState;