export interface ChannelTokenDataInterface {
  token: string;
  uid: number;
  expiresAt?: number;
  generatedAt?: number;
  channel: string;
}

export interface TokenApiResponse {
  data: ChannelTokenDataInterface;
}

export interface TranslationStartedPayload {
  palabraTask?: {
    data?: {
      task_id?: string;
      local_uid?: number; // translator UID from Palabra
      remote_uid?: number; // original speaker UID
      translations?: Array<{ local_uid?: number; remote_uid?: number }>;
    };
  };
}


