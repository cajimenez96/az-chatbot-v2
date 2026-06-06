import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenant_settings')
export class TenantSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', default: 'America/Argentina/Buenos_Aires' })
  timezone: string;

  @Column({ name: 'handoff_timeout_minutes', type: 'int', default: 30 })
  handoffTimeoutMinutes: number;

  @Column({ name: 'main_menu_message', type: 'text', nullable: true })
  mainMenuMessage: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
