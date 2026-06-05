// Roles
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_OWNER = 'TENANT_OWNER',
  AGENT = 'AGENT',
  VIEWER = 'VIEWER',
}

// Tenant
export enum TenantStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

// Conversation
export enum ConversationState {
  IDLE = 'idle',
  IN_FLOW = 'in_flow',
  WAITING_INPUT = 'waiting_input',
  HUMAN_MODE = 'human_mode',
  CLOSED = 'closed',
}

// Block
export enum BlockType {
  MESSAGE = 'message',
  QUESTION = 'question',
  MENU = 'menu',
  HANDOFF = 'handoff',
}

// Lead
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  LOST = 'lost',
  WON = 'won',
}

// WhatsApp session
export enum WaSessionStatus {
  PENDING_QR = 'pending_qr',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

// Payment
export enum PaymentMethod {
  MERCADOPAGO = 'mercadopago',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}
