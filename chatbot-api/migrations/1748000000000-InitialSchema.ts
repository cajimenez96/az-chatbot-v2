import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748000000000 implements MigrationInterface {
  name = 'InitialSchema1748000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);

    // ─── Enums ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE tenant_status AS ENUM ('trial', 'active', 'suspended', 'deleted')
    `);
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'TENANT_OWNER', 'AGENT', 'VIEWER')
    `);
    await queryRunner.query(`
      CREATE TYPE payment_method AS ENUM ('mercadopago', 'bank_transfer')
    `);
    await queryRunner.query(`
      CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed')
    `);
    await queryRunner.query(`
      CREATE TYPE block_type AS ENUM ('MESSAGE', 'QUESTION', 'MENU', 'HANDOFF')
    `);
    await queryRunner.query(`
      CREATE TYPE conversation_state AS ENUM (
        'idle', 'in_flow', 'waiting_input', 'human_mode', 'pending_handoff', 'closed'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE wa_session_status AS ENUM ('pending_qr', 'connected', 'disconnected')
    `);
    await queryRunner.query(`
      CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'lost', 'won')
    `);
    await queryRunner.query(`
      CREATE TYPE message_role AS ENUM ('user', 'bot', 'agent')
    `);
    await queryRunner.query(`
      CREATE TYPE message_type AS ENUM ('text', 'image', 'audio', 'document', 'button_response')
    `);

    // ─── Tenants ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE tenants (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name          VARCHAR(255) NOT NULL,
        slug          VARCHAR(100) NOT NULL UNIQUE,
        owner_user_id UUID,
        status        tenant_status NOT NULL DEFAULT 'trial',
        trial_ends_at TIMESTAMPTZ,
        paid_until    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE TABLE tenant_settings (
        id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        timezone                 VARCHAR(50) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
        handoff_timeout_minutes  INT NOT NULL DEFAULT 30,
        main_menu_message        TEXT,
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ─── Users ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name    VARCHAR(100) NOT NULL,
        last_name     VARCHAR(100) NOT NULL,
        role          user_role NOT NULL DEFAULT 'TENANT_OWNER',
        is_active     BOOLEAN NOT NULL DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Now that users table exists, add FK from tenants.owner_user_id
    await queryRunner.query(`
      ALTER TABLE tenants
        ADD CONSTRAINT fk_tenants_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
    `);

    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  VARCHAR(255) NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        revoked_at  TIMESTAMPTZ
      )
    `);

    // ─── Payments ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE payments (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        amount_cents   INT NOT NULL,
        currency       VARCHAR(3) NOT NULL DEFAULT 'ARS',
        method         payment_method NOT NULL,
        status         payment_status NOT NULL DEFAULT 'pending',
        external_ref   VARCHAR(255),
        notes          TEXT,
        paid_at        TIMESTAMPTZ,
        confirmed_at   TIMESTAMPTZ,
        confirmed_by   UUID REFERENCES users(id),
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ─── Flows & Blocks ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE flows (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name           VARCHAR(255) NOT NULL,
        description    TEXT,
        version        INT NOT NULL DEFAULT 1,
        is_active      BOOLEAN NOT NULL DEFAULT false,
        is_draft       BOOLEAN NOT NULL DEFAULT true,
        entry_block_id UUID,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE blocks (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        flow_id           UUID REFERENCES flows(id) ON DELETE CASCADE,
        type              block_type NOT NULL DEFAULT 'MESSAGE',
        message           TEXT,
        save_as           VARCHAR(100),
        validation_schema JSONB,
        next_block_id     UUID,
        is_faq            BOOLEAN NOT NULL DEFAULT false,
        keywords          TEXT[] NOT NULL DEFAULT '{}',
        hits              INT NOT NULL DEFAULT 0,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE blocks
        ADD CONSTRAINT fk_blocks_next FOREIGN KEY (next_block_id) REFERENCES blocks(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE flows
        ADD CONSTRAINT fk_flows_entry FOREIGN KEY (entry_block_id) REFERENCES blocks(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE block_options (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        block_id      UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
        tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        label         VARCHAR(255) NOT NULL,
        next_block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
        order_index   INT NOT NULL DEFAULT 0
      )
    `);

    // ─── WhatsApp Sessions ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE wa_sessions (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        openwa_session_id   VARCHAR(255) NOT NULL,
        status              wa_session_status NOT NULL DEFAULT 'pending_qr',
        qr_code             TEXT,
        connected_at        TIMESTAMPTZ,
        last_activity_at    TIMESTAMPTZ
      )
    `);

    // ─── Conversations ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE conversations (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_phone     VARCHAR(30) NOT NULL,
        wa_session_id     UUID REFERENCES wa_sessions(id) ON DELETE SET NULL,
        current_block_id  UUID REFERENCES blocks(id) ON DELETE SET NULL,
        flow_id           UUID REFERENCES flows(id) ON DELETE SET NULL,
        state             conversation_state NOT NULL DEFAULT 'idle',
        assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
        context           JSONB NOT NULL DEFAULT '{}',
        started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_activity_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at         TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE TABLE conversation_messages (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role            message_role NOT NULL,
        content         TEXT NOT NULL,
        message_type    message_type NOT NULL DEFAULT 'text',
        sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ─── Leads ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE leads (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name              VARCHAR(255),
        email             VARCHAR(255),
        phone             VARCHAR(30),
        status            lead_status NOT NULL DEFAULT 'new',
        assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
        conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
        custom_fields     JSONB NOT NULL DEFAULT '{}',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ─── Indexes ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX idx_conversations_tenant_phone ON conversations(tenant_id, contact_phone);
      CREATE INDEX idx_conversations_tenant_state ON conversations(tenant_id, state);
      CREATE INDEX idx_conversations_last_activity ON conversations(tenant_id, last_activity_at);
      CREATE INDEX idx_blocks_tenant_flow ON blocks(tenant_id, flow_id);
      CREATE INDEX idx_blocks_keywords_gin ON blocks USING GIN (keywords);
      CREATE INDEX idx_blocks_faq ON blocks(tenant_id) WHERE is_faq = true;
      CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
      CREATE INDEX idx_payments_tenant ON payments(tenant_id, created_at DESC);
      CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
      CREATE INDEX idx_users_tenant ON users(tenant_id);
    `);

    // ─── Row-Level Security ────────────────────────────────────────────────────
    const rlsTables = [
      'tenant_settings',
      'users',
      'payments',
      'flows',
      'blocks',
      'block_options',
      'wa_sessions',
      'conversations',
      'conversation_messages',
      'leads',
    ];

    for (const table of rlsTables) {
      await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);

      await queryRunner.query(`
        CREATE POLICY tenant_isolation ON ${table}
          FOR ALL
          USING (
            tenant_id::text = current_setting('app.current_tenant_id', true)
            OR current_setting('app.bypass_rls', true) = 'on'
          )
          WITH CHECK (
            tenant_id::text = current_setting('app.current_tenant_id', true)
            OR current_setting('app.bypass_rls', true) = 'on'
          )
      `);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA public CASCADE`);
    await queryRunner.query(`CREATE SCHEMA public`);
    await queryRunner.query(`GRANT ALL ON SCHEMA public TO postgres`);
    await queryRunner.query(`GRANT ALL ON SCHEMA public TO public`);
  }
}
