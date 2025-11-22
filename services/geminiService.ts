import { GoogleGenAI, Type } from "@google/genai";
import { FinancialRecord } from "../types";

// Initialize the client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in process.env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSolarProposalText = async (
  clientName: string,
  consumption: number,
  city: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Erro: API Key não configurada. Adicione sua chave da API do Google Gemini.";

  try {
    const prompt = `
      Atue como um engenheiro especialista em energia solar da empresa 'SolarTekPro'.
      Gere um texto de proposta comercial persuasivo e técnico para o cliente ${clientName}.
      
      Dados do cliente:
      - Consumo médio mensal: ${consumption} kWh
      - Cidade: ${city}
      
      A proposta deve incluir:
      1. Uma saudação profissional.
      2. Estimativa aproximada do tamanho do sistema necessário (em kWp) baseada no consumo (considere irradiação média do Brasil).
      3. Estimativa de economia anual em Reais (R$) (use tarifa média de R$ 0,90/kWh).
      4. Impacto ambiental positivo (CO2 evitado).
      5. Um convite para fechar negócio.

      Mantenha o tom profissional, moderno e focado em economia e sustentabilidade.
      Formate a resposta em Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a proposta no momento.";
  } catch (error) {
    console.error("Erro ao gerar proposta:", error);
    return "Erro ao conectar com a IA. Verifique sua conexão ou chave de API.";
  }
};

export const analyzeFinancialTrends = async (data: FinancialRecord[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Erro: API Key não configurada.";

  try {
    const dataStr = JSON.stringify(data);
    const prompt = `
      Analise os seguintes dados financeiros mensais da SolarTekPro:
      ${dataStr}

      Forneça um resumo executivo curto (máximo 3 parágrafos) identificando:
      1. Tendência de crescimento ou queda.
      2. Mês de melhor desempenho.
      3. Uma sugestão estratégica baseada nos números para melhorar a margem de lucro.
      
      Use formatação Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Análise indisponível.";
  } catch (error) {
    console.error("Erro na análise financeira:", error);
    return "Erro ao realizar análise inteligente.";
  }
};
