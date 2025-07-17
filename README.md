# 🚀 Aplicador Automático de Cupons do Mercado Livre

## 📋 Visão Geral

Como eu sou preguiçoso para ficar clicando na mesma coisa o tempo todo, eu decidi criar um sistema de automação para mim e de código próprio.<br>
Este script automatiza a aplicação de cupons no Mercado Livre, navegando por todas as páginas disponíveis e aplicando todos os cupons encontrados de forma automática.

---

## 🛠️ Instalação e Configuração

| Etapa | Descrição | Detalhes |
|-------|-----------|----------|
| **1. Instalar Extensão** | Instale uma extensão de UserScript | • [Violentmonkey](https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag) (Eu gosto de usar esse) |
| **2. Criar Novo Script** | Abra a extensão e crie um novo script | • Clique no ícone da extensão<br>• Selecione o + "Criar novo script"<br>• Cole o [código](https://github.com/o-giu/giu-aplicador-automatico-de-cupons-do-mercado-livre/blob/main/codigo.js) fornecido |
| **3. Salvar Script** | Salve o script | • Certifique-se que está ativo<br>• O script funcionará apenas em páginas de cupons do ML |

---

## ⚙️ Como Usar

| Passo | Ação | Resultado Esperado |
|-------|------|-------------------|
| **1. Acesso** | Navegue para `https://www.mercadolivre.com.br/cupons` | Script será carregado automaticamente |
| **2. Interface** | Observe os elementos na tela | • Botão verde no canto superior direito<br>• Painel de status abaixo do botão <br>![image](https://github.com/user-attachments/assets/9dc94157-2177-472f-b2d5-7126fa485d3b) |
| **3. Iniciar** | Clique em "🚀 APLICAR TODOS OS CUPONS" | • Botão ficará vermelho<br>• Automação iniciará <br>![image](https://github.com/user-attachments/assets/ed3994dd-b00a-4617-bbc8-bf3cc78aa006) |
| **4. Acompanhar** | Monitore o progresso | • Status atualizado em tempo real<br>• Navegação automática entre páginas <br>![image](https://github.com/user-attachments/assets/81c4f72a-5019-4c3f-a29f-b52ae33c775a) |

![image](https://github.com/user-attachments/assets/386e0fb3-e9d9-46df-bc81-afb5f30d01d4)

---

## 🔧 Funcionalidades Técnicas

### Detecção Automática
| Recurso | Como Funciona |
|---------|--------------|
| **Páginas Totais** | Detecta automaticamente o número total de páginas |
| **Botões de Cupons** | Encontra todos os botões "Aplicar" visíveis |
| **Estado Persistente** | Mantém progresso mesmo se a página recarregar |

### Navegação Inteligente
| Característica | Benefício |
|----------------|-----------|
| **Navegação Forçada** | Garante que todas as páginas sejam visitadas |
| **Continuação Automática** | Retoma de onde parou se interrompido |
| **Controle de Velocidade** | Pausas entre ações para evitar sobrecarga |

---

## ⚠️ Cuidados e Limitações

### Recomendações de Uso
| Aspecto | Recomendação |
|---------|--------------|
| **Janela do Navegador** | Mantenha a aba ativa durante o processo |
| **Interrupções** | Evite navegar para outras páginas do ML |

### Limitações Conhecidas
| Limitação | Impacto | Solução |
|-----------|---------|---------|
| **Cupons Expirados** | Podem gerar erros | Script continua automaticamente |

---

## 🐛 Solução de Problemas

### Problemas Comuns
| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| **Script não carrega** | Extensão não instalada | Verificar se Tampermonkey está ativo |
| **Botão não aparece** | Página incorreta | Ir para /cupons do Mercado Livre |
| **Para no meio** | Erro de conexão | Clicar em iniciar novamente |
| **Não encontra cupons** | Estrutura da página mudou | Aguardar atualização do script |

---

**Desenvolvido por:** @Giu  
**Compatibilidade:** Qualquer navegador com extensões de UserScript
