"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { ESTADOS_BR, TIPOS_SERVICO } from "@/lib/constants";
import { Aviso, BotaoEnviar, Campo } from "@/components/form";
import {
  enviarOrcamentoPublico,
  type EstadoOrcamento,
} from "@/app/actions/orcamentos";

export function FormularioOrcamentoPublico({ token }: { token: string }) {
  const [estado, acao] = useActionState<EstadoOrcamento, FormData>(
    enviarOrcamentoPublico,
    {}
  );

  /* ------------------------------------------------- Confirmação de envio */
  if (estado.protocolo) {
    return (
      <div className="animar-entrada py-4 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-marca-500 text-white">
          <CheckCircle2 size={32} />
        </span>

        <h3 className="mt-4 text-lg font-bold text-texto">
          Solicitação enviada com sucesso!
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-suave">
          Recebemos seu pedido e nossa equipe já está analisando. Entraremos em
          contato pelo telefone informado em até 24 horas úteis.
        </p>

        <div className="mx-auto mt-5 max-w-xs rounded-xl bg-marca-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-marca-700">
            Seu protocolo
          </p>
          <p className="mt-0.5 font-mono text-xl font-bold text-marca-800">
            {estado.protocolo}
          </p>
        </div>

        <p className="mt-4 text-[11px] text-suave">
          Guarde este número para consultar o andamento do seu orçamento.
        </p>
      </div>
    );
  }

  /* ----------------------------------------------------------- Formulário */
  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      {/* Contato */}
      <fieldset className="space-y-4">
        <legend className="rotulo mb-1">Seus dados</legend>

        <Campo rotulo="Nome completo" obrigatorio>
          <input
            name="nomeContato"
            required
            minLength={3}
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            className="campo"
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="WhatsApp / Telefone" obrigatorio>
            <input
              name="telefone"
              required
              minLength={10}
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              className="campo"
            />
          </Campo>

          <Campo rotulo="E-mail">
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className="campo"
            />
          </Campo>
        </div>
      </fieldset>

      {/* Serviço */}
      <fieldset className="space-y-4 border-t border-borda pt-5">
        <legend className="rotulo mb-1">Sobre o serviço</legend>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Campo rotulo="Tipo de serviço" obrigatorio>
            <select name="tipoServico" required defaultValue="MONTAGEM" className="campo">
              {Object.entries(TIPOS_SERVICO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Quantos móveis?" obrigatorio>
            <input
              name="quantidadeItens"
              type="number"
              min={1}
              max={999}
              defaultValue={1}
              required
              className="campo"
            />
          </Campo>
        </div>

        <Campo
          rotulo="Descreva os móveis"
          obrigatorio
          dica="Quanto mais detalhes, mais preciso fica o orçamento."
        >
          <textarea
            name="descricao"
            required
            minLength={10}
            rows={4}
            placeholder="Ex.: guarda-roupa 6 portas com espelho, uma cômoda de 5 gavetas e um painel de TV. Os móveis já foram entregues e estão nas caixas."
            className="campo resize-none"
          />
        </Campo>

        <Campo rotulo="Data desejada para o serviço">
          <input type="date" name="prazoDesejado" className="campo" />
        </Campo>
      </fieldset>

      {/* Endereço */}
      <fieldset className="space-y-4 border-t border-borda pt-5">
        <legend className="rotulo mb-1">Onde será o serviço</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="CEP">
            <input
              name="cep"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              className="campo"
            />
          </Campo>

          <Campo rotulo="Endereço" className="sm:col-span-2">
            <input
              name="endereco"
              autoComplete="street-address"
              placeholder="Rua, número, complemento"
              className="campo"
            />
          </Campo>

          <Campo rotulo="Cidade" className="sm:col-span-2">
            <input
              name="cidade"
              autoComplete="address-level2"
              placeholder="Sua cidade"
              className="campo"
            />
          </Campo>

          <Campo rotulo="UF">
            <select name="estado" defaultValue="SP" className="campo">
              <option value="">—</option>
              {ESTADOS_BR.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </fieldset>

      <BotaoEnviar
        className="btn btn-principal w-full !py-3.5 !text-base"
        icone={<Send size={17} />}
      >
        Enviar solicitação de orçamento
      </BotaoEnviar>
    </form>
  );
}
