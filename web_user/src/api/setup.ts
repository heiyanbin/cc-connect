import api from './client';

// Weixin Begin response
export interface WeixinBeginResponse {
  qr_key: string;
  qr_url: string;
}

// Weixin Poll response
export interface WeixinPollResponse {
  status: 'wait' | 'scaned' | 'confirmed' | 'expired';
  bot_token?: string;
  ilink_bot_id?: string;
  base_url?: string;
  ilink_user_id?: string;
}

// Weixin Save request
export interface WeixinSaveRequest {
  project: string;
  token: string;
  base_url?: string;
  ilink_bot_id?: string;
  ilink_user_id?: string;
}

// Weixin Save response
export interface WeixinSaveResponse {
  message: string;
  restart_required: boolean;
}

// Start QR flow
export const setupWeixinBegin = (): Promise<WeixinBeginResponse> =>
  api.post<WeixinBeginResponse>('/setup/weixin/begin');

// Poll QR status
export const setupWeixinPoll = (qrKey: string): Promise<WeixinPollResponse> =>
  api.post<WeixinPollResponse>('/setup/weixin/poll', { qr_key: qrKey });

// Save binding after confirmed
export const setupWeixinSave = (body: WeixinSaveRequest): Promise<WeixinSaveResponse> =>
  api.post<WeixinSaveResponse>('/setup/weixin/save', body);