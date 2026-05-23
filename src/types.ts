/**
 * Types representing the models for "Gestão de Revendas e Casinhas"
 */

export interface Revenda {
  id: string; // generated via Date.now().toString()
  userId: string; // ID of the logged-in user
  nomeRevendedor: string;
  dataVencimento: string; // YYYY-MM-DD format
  quantidadeCasinhas: number; // slots (for normal: count, for mensalista/ilimitado: optional/reference)
  precoVendaUnitario: number; // Preço de venda unitário por casinha OR flat rate if mensalista/ilimitado
  meuCustoUnitario: number; // Seu custo unitário por casinha OR flat cost if mensalista/ilimitado
  valorPago: number; // Quanto o revendedor já pagou
  tipoPlano?: 'normal' | 'mensalista' | 'ilimitado'; // Tipo de plano de cobrança
}

export type StatusCobrança = 'Pago' | 'Parcial' | 'Pendente';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface DashboardStats {
  totalCasinhas: number;
  faturamentoCobrado: number; // Expected total faturamento
  custoTotal: number; // Expected total custo
  lucroRealizado: number; // Soma(Valor Pago) - Soma(Custo Total)
}
