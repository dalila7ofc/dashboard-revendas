import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ShieldAlert } from 'lucide-react';
import { Revenda, Toast } from './types';

// Importando Subcomponentes Modulares
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import Filters from './components/Filters';
import ResellerTable from './components/ResellerTable';
import RevendaModal from './components/RevendaModal';
import ConfirmModal from './components/ConfirmModal';
import ToastContainer from './components/ToastContainer';

// Firebase Engine
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';


const STORAGE_KEY = 'revendas_slots_mgt_db_v1';

// Funções auxiliares organizadas para formatação e lógica de competência de meses
const formatMonthName = (monthStr: string) => {
  const NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const mIdx = parseInt(month, 10) - 1;
  if (mIdx >= 0 && mIdx < 12) {
    return `${NAMES[mIdx]} de ${year}`;
  }
  return monthStr;
};

const getClosestPreviousMonthWithRecords = (targetMonth: string, allRevendas: Revenda[]) => {
  if (!allRevendas || allRevendas.length === 0) return null;
  const targetTime = new Date(targetMonth + '-02').getTime();
  
  const monthsWithRecords = Array.from(new Set(
    allRevendas
      .filter(r => r.dataVencimento && r.dataVencimento.length >= 7)
      .map(r => r.dataVencimento.substring(0, 7))
  )).filter(m => {
    const mTime = new Date(m + '-02').getTime();
    return mTime < targetTime;
  });

  if (monthsWithRecords.length === 0) return null;
  
  monthsWithRecords.sort((a, b) => b.localeCompare(a));
  return monthsWithRecords[0];
};

const getPreviousMonthString = (monthStr: string) => {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const prevDate = new Date(year, month - 1 - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
};

export default function App() {
  // Estado de Autenticação
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Estado Principal de Dados
  const [revendas, setRevendas] = useState<Revenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper para obter o mês de referência atual (Formato: YYYY-MM)
  const getCurrentMonthString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Estado do Mês Selecionado (Ex: "2026-05")
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthString());

  // Listener de Estado de Autenticação Google
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sincronização em tempo real com Firebase Firestore isolado por Usuário
  useEffect(() => {
    if (!currentUser) {
      setRevendas([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = 'revendas';
    // Consulta apenas os registros pertencentes ao usuário logado
    const userQuery = query(collection(db, path), where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      userQuery,
      (snapshot) => {
        const list: Revenda[] = [];
        snapshot.forEach((snapshotDoc) => {
          list.push({ id: snapshotDoc.id, ...snapshotDoc.data() } as Revenda);
        });
        
        // Ordenar por ID de forma decrescente para que os mais recentes apareçam no topo
        list.sort((a, b) => b.id.localeCompare(a.id));

        // Se o Firebase do usuário estiver vazio, mas houver dados locais no localStorage, faz a migração automática segura
        if (snapshot.empty) {
          const rawData = localStorage.getItem(STORAGE_KEY);
          if (rawData) {
            // Remover imediatamente do localStorage para evitar re-entradas e múltiplos disparos
            localStorage.removeItem(STORAGE_KEY);
            
            const performMigration = async () => {
              try {
                const localList = JSON.parse(rawData) as Revenda[];
                if (localList.length > 0) {
                  const batch = writeBatch(db);
                  
                  // Função auxiliar inline para formatar data em YYYY-MM-DD
                  const cleanDate = (dStr: string) => {
                    if (!dStr) return new Date().toISOString().split('T')[0];
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dStr)) {
                      const [d, m, y] = dStr.split('/');
                      return `${y}-${m}-${d}`;
                    }
                    try {
                      const parsed = new Date(dStr);
                      if (!isNaN(parsed.getTime())) {
                        return parsed.toISOString().split('T')[0];
                      }
                    } catch (e) {}
                    return new Date().toISOString().split('T')[0];
                  };

                  localList.forEach((item) => {
                    const docRef = doc(db, 'revendas', item.id);
                    batch.set(docRef, {
                      userId: currentUser.uid,
                      tipoPlano: item.tipoPlano || 'normal',
                      nomeRevendedor: item.nomeRevendedor || 'Revendedor Sem Nome',
                      dataVencimento: cleanDate(item.dataVencimento),
                      quantidadeCasinhas: Math.round(Number(item.quantidadeCasinhas || 0)),
                      precoVendaUnitario: Number(item.precoVendaUnitario || 0),
                      meuCustoUnitario: Number(item.meuCustoUnitario || 0),
                      valorPago: Number(item.valorPago || 0),
                    });
                  });

                  await batch.commit();
                  addToast('Sincronização: Seus dados foram migrados com sucesso para a sua conta Google na nuvem!', 'success');
                }
              } catch (err) {
                console.error('Erro de migração:', err);
              }
            };
            performMigration();
          }
        }

        setRevendas(list);
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Estados dos Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Estados do Modal do Formulário (Criar / Editar)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRevenda, setEditingRevenda] = useState<Revenda | null>(null);

  // Estados dos Modais de Confirmação Customizados
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [revendaToDelete, setRevendaToDelete] = useState<Revenda | null>(null);
  
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Estado do Sistema de Toasts (Notificações Temporárias)
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Remover toast automaticamente após 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Login com Conta Google
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
      addToast('Conectado com sucesso com sua conta Google!', 'success');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      addToast('Erro ao realizar login com o Google.', 'error');
    }
  };

  // Sair da Conta Google
  const handleLogout = async () => {
    try {
      await signOut(auth);
      addToast('Sessão encerrada com sucesso.', 'info');
    } catch (error) {
      addToast('Erro ao desconectar da conta.', 'error');
    }
  };

  // DAR OU DESFAZER BAIXA (Alterna Valor Pago entre Total e zero)
  const handleQuickPay = async (id: string) => {
    if (!currentUser) return;
    const item = revendas.find((r) => r.id === id);
    if (!item) return;

    const isSlots = !item.tipoPlano || item.tipoPlano === 'normal';
    const expectedBilling = isSlots ? ((item.quantidadeCasinhas || 0) * (item.precoVendaUnitario || 0)) : (item.precoVendaUnitario || 0);
    
    // Se já estiver pago, zera o valor (Estorna). Senão, preenche totalmente.
    const isPaid = item.valorPago >= expectedBilling;
    const novoValorPago = isPaid ? 0 : expectedBilling;

    const path = `revendas/${id}`;
    try {
      await setDoc(doc(db, 'revendas', id), {
        userId: currentUser.uid,
        tipoPlano: item.tipoPlano || 'normal',
        nomeRevendedor: item.nomeRevendedor,
        dataVencimento: item.dataVencimento,
        quantidadeCasinhas: item.quantidadeCasinhas || 0,
        precoVendaUnitario: item.precoVendaUnitario || 0,
        meuCustoUnitario: item.meuCustoUnitario || 0,
        valorPago: novoValorPago,
      });
      
      if (isPaid) {
        addToast(`A baixa de ${item.nomeRevendedor} foi desfeita (Voltada para Pendente).`, 'info');
      } else {
        addToast(`Cobrança de ${item.nomeRevendedor} alterada para Totalmente Pago!`, 'success');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      addToast('Erro ao atualizar status da cobrança no Firebase.', 'error');
    }
  };

  // ADICIONAR E SALVAR REVENDA (Novo ou Editado)
  const handleSaveRevenda = async (data: Omit<Revenda, 'id' | 'userId'> & { id?: string }) => {
    if (!currentUser) return;
    const id = data.id || Date.now().toString();
    const path = `revendas/${id}`;
    try {
      await setDoc(doc(db, 'revendas', id), {
        userId: currentUser.uid,
        tipoPlano: data.tipoPlano || 'normal',
        nomeRevendedor: data.nomeRevendedor,
        dataVencimento: data.dataVencimento,
        quantidadeCasinhas: data.quantidadeCasinhas,
        precoVendaUnitario: data.precoVendaUnitario,
        meuCustoUnitario: data.meuCustoUnitario,
        valorPago: data.valorPago,
      });
      if (data.id) {
        addToast(`Revendedor "${data.nomeRevendedor}" atualizado no Firebase com sucesso.`, 'success');
      } else {
        addToast(`Novo revendedor "${data.nomeRevendedor}" cadastrado e salvo no Firebase!`, 'success');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      addToast('Erro ao salvar no Firebase.', 'error');
    }
  };

  // CONFIRMAÇÃO E DELEÇÃO
  const handleRequestDelete = (item: Revenda) => {
    setRevendaToDelete(item);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentUser || !revendaToDelete) return;
    const id = revendaToDelete.id;
    const path = `revendas/${id}`;
    try {
      await deleteDoc(doc(db, 'revendas', id));
      addToast(`Revendedor "${revendaToDelete.nomeRevendedor}" foi removido do Firebase.`, 'warning');
      setRevendaToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      addToast('Erro ao remover do Firebase.', 'error');
    }
  };

  // REINICIAR BANCO DE DADOS (Zerar apenas os dados do usuário autenticado)
  const handleRequestReset = () => {
    setIsConfirmResetOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!currentUser) return;
    const path = 'revendas';
    try {
      const batch = writeBatch(db);
      revendas.forEach((item) => {
        batch.delete(doc(db, 'revendas', item.id));
      });
      await batch.commit();
      addToast('Todo o seu banco de dados do Firebase foi resetado com sucesso.', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      addToast('Erro ao limpar os dados no Firebase.', 'error');
    }
  };

  // EXPORTAÇÃO DE RELATÓRIO DO BANCO EM .CSV COMPATÍVEL COM EXCEL/GOOGLE PLANILHAS
  const handleExportCSV = () => {
    if (monthlyRevendas.length === 0) {
      addToast(`Não há registros de revendas cadastrados em ${formatMonthName(selectedMonth)} para exportar!`, 'error');
      return;
    }

    try {
      // Cabeçalho compatível com Excel brasileiro (utilizando ponto-e-vírgula ";")
      const headers = [
        'ID único',
        'Nome do Revendedor',
        'Tipo Plano',
        'Data Vencimento',
        'Casinhas (Slots)',
        'Preco de Venda Un / Plano (R$)',
        'Seu Custo Un / Plano (R$)',
        'Faturamento Cobrado (R$)',
        'Custo Infra (R$)',
        'Valor Pago (R$)',
        'Lucro Realizado (R$)',
        'Status Cobranca',
      ];

      // Formatação das linhas respeitando acentuação e formatos de números (Apenas do mês selecionado)
      const rows = monthlyRevendas.map((item) => {
        const isSlots = !item.tipoPlano || item.tipoPlano === 'normal';
        const expectedRevenue = isSlots ? (item.quantidadeCasinhas * item.precoVendaUnitario) : item.precoVendaUnitario;
        const expectedCost = isSlots ? (item.quantidadeCasinhas * item.meuCustoUnitario) : item.meuCustoUnitario;
        const netProfit = item.precoVendaUnitario === 0 ? -expectedCost : (expectedRevenue - expectedCost);

        let statusText = 'Pendente';
        if (item.precoVendaUnitario === 0) {
          statusText = 'Cortesia / Isento';
        } else if (item.valorPago >= expectedRevenue && expectedRevenue > 0) {
          statusText = 'Pago';
        } else if (item.valorPago > 0) {
          statusText = 'Parcial';
        }

        return [
          item.id,
          `"${item.nomeRevendedor.replace(/"/g, '""')}"`,
          item.tipoPlano || 'normal',
          item.dataVencimento,
          item.quantidadeCasinhas,
          item.precoVendaUnitario.toFixed(2).replace('.', ','),
          item.meuCustoUnitario.toFixed(2).replace('.', ','),
          expectedRevenue.toFixed(2).replace('.', ','),
          expectedCost.toFixed(2).replace('.', ','),
          item.valorPago.toFixed(2).replace('.', ','),
          netProfit.toFixed(2).replace('.', ','),
          statusText,
        ];
      });

      // Incluindo o caractere BOM (\uFEFF) para forçar o Excel a reconhecer UTF-8 (acentuações do português)
      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      // Nome do arquivo formatado com o mês selecionado
      link.setAttribute('download', `backup_revendas_casinhas_${selectedMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast(`Planilha CSV de ${formatMonthName(selectedMonth)} gerada com sucesso! Download iniciado.`, 'success');
    } catch (err) {
      addToast('Erro ao exportar faturamento mensal.', 'error');
    }
  };

  // Filtro de Mês / Competência Selecionada (Todos os cálculos dependem deste array)
  const monthlyRevendas = useMemo(() => {
    return revendas.filter((item) => {
      if (!item.dataVencimento) return false;
      return item.dataVencimento.startsWith(selectedMonth);
    });
  }, [revendas, selectedMonth]);

  // Lista dinâmica de meses com registros ou de navegação padrão
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    // Sempre incluir o mês atual comercial
    const current = getCurrentMonthString();
    months.add(current);

    // Mês seguinte (para planejamento futuro)
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    const nextY = nextDate.getFullYear();
    const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
    months.add(`${nextY}-${nextM}`);

    // Mês anterior (para consultas retroativas rápidas)
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevY = prevDate.getFullYear();
    const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
    months.add(`${prevY}-${prevM}`);

    // Adicionar meses presentes nos faturamentos do Firestore
    revendas.forEach((item) => {
      if (item.dataVencimento && item.dataVencimento.length >= 7) {
        const ym = item.dataVencimento.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          months.add(ym);
        }
      }
    });

    return Array.from(months).sort();
  }, [revendas]);

  // Função dedicada para puxar revendedores de faturamentos de meses anteriores para o ativo
  const handleCopyFromPreviousMonth = async () => {
    if (!currentUser) return;
    
    const sourceMonth = getClosestPreviousMonthWithRecords(selectedMonth, revendas);
    if (!sourceMonth) {
      addToast('Nenhum mês anterior com cadastros foi encontrado para copiar.', 'error');
      return;
    }

    const prevRecords = revendas.filter(r => r.dataVencimento && r.dataVencimento.startsWith(sourceMonth));
    if (prevRecords.length === 0) {
      addToast('Nenhum registro encontrado no mês anterior para copiar.', 'info');
      return;
    }

    try {
      setIsLoading(true);
      const batch = writeBatch(db);
      
      // Função auxiliar para calcular a nova data de vencimento no mês selecionado
      const getUpdatedDueDate = (oldDateStr: string, newYearMonth: string) => {
        const parts = oldDateStr.split('-');
        const dayStr = parts.length === 3 ? parts[2] : '10'; // Padrão: dia 10
        const [newYear, newMonth] = newYearMonth.split('-');
        
        let day = parseInt(dayStr, 10);
        if (isNaN(day)) day = 10;
        
        const lastDayOfNewMonth = new Date(Number(newYear), Number(newMonth), 0).getDate();
        const targetDay = Math.min(day, lastDayOfNewMonth);
        const paddedDay = String(targetDay).padStart(2, '0');
        
        return `${newYear}-${newMonth}-${paddedDay}`;
      };

      prevRecords.forEach((item) => {
        // Gerar um novo ID de faturamento para separar do histórico dos meses passados!
        const newId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const docRef = doc(db, 'revendas', newId);
        
        batch.set(docRef, {
          userId: currentUser.uid,
          tipoPlano: item.tipoPlano || 'normal',
          nomeRevendedor: item.nomeRevendedor,
          dataVencimento: getUpdatedDueDate(item.dataVencimento, selectedMonth),
          quantidadeCasinhas: item.quantidadeCasinhas || 0,
          precoVendaUnitario: item.precoVendaUnitario || 0,
          meuCustoUnitario: item.meuCustoUnitario || 0,
          valorPago: 0, // Inicia como PENDENTE na nova competência!
        });
      });

      await batch.commit();
      addToast(`Copiado ${prevRecords.length} revendedor(es) de ${formatMonthName(sourceMonth)} para ${formatMonthName(selectedMonth)} com sucesso!`, 'success');
    } catch (error) {
      console.error(error);
      addToast('Erro ao duplicar faturamentos no Firebase.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // CÁLCULO GERAL DAS ESTATÍSTICAS DO DASHBOARD SUPERIOR
  const coreStats = useMemo(() => {
    let totalCasinhas = 0;
    let faturamentoCobrado = 0;
    let custoTotal = 0;
    let lucroRealizado = 0;

    monthlyRevendas.forEach((item) => {
      const isSlots = !item.tipoPlano || item.tipoPlano === 'normal';
      const slots = item.quantidadeCasinhas || 0;
      const precoVenda = item.precoVendaUnitario || 0;
      const custoUnitario = item.meuCustoUnitario || 0;
      
      const faturamentoItem = isSlots ? (slots * precoVenda) : precoVenda;
      const custoItem = isSlots ? (slots * custoUnitario) : custoUnitario;

      totalCasinhas += slots;
      faturamentoCobrado += faturamentoItem;
      custoTotal += custoItem;
      lucroRealizado += (precoVenda === 0 ? -custoItem : (faturamentoItem - custoItem));
    });

    return {
      totalCasinhas,
      faturamentoCobrado,
      custoTotal,
      lucroRealizado,
    };
  }, [monthlyRevendas]);

  // CÁLCULO DE CONTADORES POR STATUS PARA PILLS DE FILTROS
  const filterCounts = useMemo(() => {
    let todos = monthlyRevendas.length;
    let pago = 0;
    let parcial = 0;
    let pendente = 0;

    monthlyRevendas.forEach((item) => {
      const isSlots = !item.tipoPlano || item.tipoPlano === 'normal';
      const faturamento = isSlots ? (item.quantidadeCasinhas * item.precoVendaUnitario) : item.precoVendaUnitario;
      if (item.valorPago >= faturamento && faturamento > 0) {
        pago++;
      } else if (item.valorPago > 0) {
        parcial++;
      } else {
        pendente++;
      }
    });

    return { todos, pago, parcial, pendente };
  }, [monthlyRevendas]);

  // FILTRAGEM DOS DADOS EM TEMPO REAL
  const filteredRevendas = useMemo(() => {
    return monthlyRevendas.filter((item) => {
      // Filtro de Busca (Nome do revendedor)
      const matchesSearch = item.nomeRevendedor.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro de Status
      const isSlots = !item.tipoPlano || item.tipoPlano === 'normal';
      const expectedRevenue = isSlots ? (item.quantidadeCasinhas * item.precoVendaUnitario) : item.precoVendaUnitario;
      let matchesStatus = true;

      if (statusFilter === 'pago') {
        matchesStatus = item.valorPago >= expectedRevenue && expectedRevenue > 0;
      } else if (statusFilter === 'parcial') {
        matchesStatus = item.valorPago > 0 && item.valorPago < expectedRevenue;
      } else if (statusFilter === 'pendente') {
        matchesStatus = item.valorPago === 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [monthlyRevendas, searchQuery, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('todos');
    addToast('Filtros e termos de busca limpos.', 'info');
  };

  const handleEditClick = (item: Revenda) => {
    setEditingRevenda(item);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingRevenda(null);
    setIsFormOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-xs font-medium font-mono tracking-widest uppercase">Inicializando Sessão...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-12 selection:bg-indigo-500/35 selection:text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-6"
          id="login-card-container"
        >
          {/* Brand Shield */}
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/10 text-white mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight" id="login-title">
              Dashboard Revendas
            </h1>
            <p className="text-xs font-semibold text-slate-505 uppercase tracking-widest mt-1">
              Controle de Slots & Finanças
            </p>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            Acesse com segurança usando sua conta do Google para visualizar, editar e gerir faturamentos em tempo real de forma isolada.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 cursor-pointer border border-slate-200"
            id="btn-google-login"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.63-1.07-1.37-1.37-2.09z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          <div className="text-[10px] text-slate-600 font-medium pt-2">
            Isolamento de acesso • Seus dados 100% seguros
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/35 selection:text-white">
      {/* Cabeçalho Fixo */}
      <Header
        onAddClick={handleAddNewClick}
        onExportClick={handleExportCSV}
        onResetClick={handleRequestReset}
        lucroRealizado={coreStats.lucroRealizado}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Conteúdo Principal do Painel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 space-y-6">
        
        {/* Banner Motivacional de Negócios */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors border border-indigo-500/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 font-bold text-sm">NUVEM</div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Visão Geral dos Ciclos Ativos</h4>
              <p className="text-xs text-slate-400">Verifique cobranças, baixe pagamentos e garanta lucro líquido sobre cada casinha licenciada.</p>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-500 flex gap-2 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>Sincronizado na Nuvem • Firebase Ativo</span>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400" id="firestore-loading">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-xs font-medium font-mono tracking-widest uppercase">Carregando dados do Firebase...</p>
          </div>
        ) : (
          <>
            {/* SELETOR DE COMPETÊNCIA / MÊS ATIVO DE FATURAMENTO */}
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden" id="month-selector-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/10 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">Ciclo Mensal</span>
                  <h3 className="text-lg font-black text-slate-100 tracking-tight flex flex-wrap items-center gap-2">
                    {formatMonthName(selectedMonth)}
                    <span className="text-xs font-mono font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      {monthlyRevendas.length} {monthlyRevendas.length === 1 ? 'cliente' : 'clientes'}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Botões de Navegação */}
              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = availableMonths.indexOf(selectedMonth);
                    if (currentIndex > 0) {
                      setSelectedMonth(availableMonths[currentIndex - 1]);
                    } else {
                      setSelectedMonth(getPreviousMonthString(selectedMonth));
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800/50 hover:text-slate-100 transition-all flex items-center gap-1 active:scale-95 cursor-pointer selection:bg-transparent"
                  title="Mês Anterior"
                  id="btn-prev-month"
                >
                  ◀
                </button>

                {/* Seletor Dropdown rápido para saltar para qualquer mês */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[150px] text-center"
                  id="select-month-dropdown"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthName(m)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = availableMonths.indexOf(selectedMonth);
                    if (currentIndex !== -1 && currentIndex < availableMonths.length - 1) {
                      setSelectedMonth(availableMonths[currentIndex + 1]);
                    } else {
                      const [yr, mo] = selectedMonth.split('-').map(Number);
                      const nextDate = new Date(yr, mo, 1);
                      const nextY = nextDate.getFullYear();
                      const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
                      setSelectedMonth(`${nextY}-${nextM}`);
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800/50 hover:text-slate-100 transition-all flex items-center gap-1 active:scale-95 cursor-pointer selection:bg-transparent"
                  title="Próximo Mês"
                  id="btn-next-month"
                >
                  ▶
                </button>
              </div>
            </div>

            {monthlyRevendas.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-xl max-w-2xl mx-auto"
                id="empty-month-container"
              >
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mx-auto rounded-full">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-100">Competência de {formatMonthName(selectedMonth)} Iniciada!</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    Não existem cobranças cadastradas para este mês ainda. Comece preenchendo as informações ou copie os revendedores ativos e suas casinhas (slots) do mês anterior de forma automática!
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {getClosestPreviousMonthWithRecords(selectedMonth, revendas) ? (
                    <button
                      type="button"
                      onClick={handleCopyFromPreviousMonth}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-650 hover:to-indigo-750 text-white text-sm font-bold rounded-2xl shadow-lg active:scale-95 cursor-pointer transition-all border border-indigo-500/15 flex items-center justify-center gap-2"
                      id="btn-pull-prev-data"
                    >
                      📋 Importar Clientes de {formatMonthName(getClosestPreviousMonthWithRecords(selectedMonth, revendas)!)}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleAddNewClick}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-950 hover:bg-slate-800 text-slate-200 text-sm font-bold rounded-2xl transition-all border border-slate-800 hover:text-slate-100 flex items-center justify-center gap-2 cursor-pointer"
                    id="btn-add-brand-new"
                  >
                    ➕ Cadastrar Manualmente
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Dashboard de Estatísticas */}
                <StatsGrid
                  totalCasinhas={coreStats.totalCasinhas}
                  faturamentoCobrado={coreStats.faturamentoCobrado}
                  custoTotal={coreStats.custoTotal}
                  lucroRealizado={coreStats.lucroRealizado}
                />

                {/* Barra de Busca e Filtros Avançados */}
                <Filters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onClearFilters={handleClearFilters}
                  counts={filterCounts}
                />

                {/* Lista e Tabela de Registros de Revenda */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Resultados ({filteredRevendas.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      Modo Desktop: Clientes e Cobranças por ID
                    </span>
                  </div>

                  <ResellerTable
                    revendas={filteredRevendas}
                    onEdit={handleEditClick}
                    onDeleteRequest={handleRequestDelete}
                    onQuickPay={handleQuickPay}
                  />
                </div>
              </>
            )}
          </>
        )}

      </main>

      {/* Roda-pé estático profissional */}
      <footer className="mt-12 py-6 border-t border-t-slate-900 bg-slate-950/40 text-center text-xs text-slate-500 space-y-2 px-4">
        <p className="font-medium">Gestão de Revendas e Tempos de Execução © 2026</p>
        <p className="text-[11px] text-slate-600">
          Infraestrutura de nuvem segura com Firebase para persistência de dados em tempo real.
        </p>
      </footer>

      {/* Modal de Formulário (Cadastro / Edição) com calculadora de Margem Realtime */}
      <RevendaModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveRevenda}
        editingRevenda={editingRevenda}
        selectedMonth={selectedMonth}
      />

      {/* Modal Customizado de Confirmação de Deleção */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja remover o cadastro do revendedor "${revendaToDelete?.nomeRevendedor}"? Essa ação não pode ser desfeita e excluirá todos os faturamentos associados.`}
        confirmText="Sim, Remover"
        cancelText="Manter"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsConfirmDeleteOpen(false);
          setRevendaToDelete(null);
        }}
      />

      {/* Modal Customizado de Confirmação de Reset Geral */}
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        title="Zerar Banco de Dados"
        message="ATENÇÃO CRÍTICA: Você está prestes a limpar todo o banco de dados de revendedores. Isso removerá de forma permanente todas as estatísticas, faturamentos, custos e histórico de casinhas cadastradas. Deseja prosseguir?"
        confirmText="Sim, Zerar Tudo"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onClose={() => setIsConfirmResetOpen(false)}
      />

      {/* Notificações Flutuantes (Toasts) */}
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />

    </div>
  );
}
