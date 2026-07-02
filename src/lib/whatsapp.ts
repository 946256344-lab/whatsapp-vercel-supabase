export type WhatsAppWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{
          wa_id?: string;
          profile?: {
            name?: string;
          };
        }>;
        messages?: Array<Record<string, unknown>>;
        statuses?: Array<Record<string, unknown>>;
      };
    }>;
  }>;
};

export type NormalizedMessage = {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  waMessageId: string;
  waId: string;
  contactName: string;
  type: string;
  text: string;
  messageTimestamp: string | null;
  raw: Record<string, unknown>;
};

export type NormalizedStatus = {
  wabaId: string;
  waMessageId: string;
  recipientId: string;
  status: string;
  statusTimestamp: string | null;
  raw: Record<string, unknown>;
};

export function messageText(message: Record<string, unknown>): string {
  const type = typeof message.type === "string" ? message.type : "unknown";
  if (type === "text") {
    const text = message.text as { body?: unknown } | undefined;
    return typeof text?.body === "string" ? text.body : "";
  }

  const typedValue = message[type];
  if (typedValue && typeof typedValue === "object") {
    return `[${type}] ${JSON.stringify(typedValue)}`;
  }

  return `[${type}]`;
}

export function whatsappTimestampToIso(timestamp: unknown): string | null {
  if (typeof timestamp !== "string" && typeof timestamp !== "number") {
    return null;
  }

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

export function extractMessages(payload: WhatsAppWebhookPayload): NormalizedMessage[] {
  const records: NormalizedMessage[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;

      const value = change.value || {};
      const contacts = new Map(
        (value.contacts || []).map((contact) => [contact.wa_id || "", contact])
      );

      for (const rawMessage of value.messages || []) {
        const message = rawMessage as Record<string, unknown>;
        const waId = typeof message.from === "string" ? message.from : "";
        const contact = contacts.get(waId);
        const type = typeof message.type === "string" ? message.type : "unknown";
        const id = typeof message.id === "string" ? message.id : "";
        if (!id || !waId) continue;

        records.push({
          wabaId: entry.id || "",
          phoneNumberId: value.metadata?.phone_number_id || "",
          displayPhoneNumber: value.metadata?.display_phone_number || "",
          waMessageId: id,
          waId,
          contactName: contact?.profile?.name || "",
          type,
          text: messageText(message),
          messageTimestamp: whatsappTimestampToIso(message.timestamp),
          raw: message,
        });
      }
    }
  }

  return records;
}

export function extractStatuses(payload: WhatsAppWebhookPayload): NormalizedStatus[] {
  const statuses: NormalizedStatus[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;

      for (const rawStatus of change.value?.statuses || []) {
        const status = rawStatus as Record<string, unknown>;
        statuses.push({
          wabaId: entry.id || "",
          waMessageId: typeof status.id === "string" ? status.id : "",
          recipientId: typeof status.recipient_id === "string" ? status.recipient_id : "",
          status: typeof status.status === "string" ? status.status : "",
          statusTimestamp: whatsappTimestampToIso(status.timestamp),
          raw: status,
        });
      }
    }
  }

  return statuses;
}

export type Followup = {
  needSummary: string;
  product: string;
  quantity: string;
  intent: string;
  status: string;
  nextAction: string;
};

export function inferFollowup(texts: string[]): Followup {
  const text = texts.join(" ").replace(/\s+/g, " ").trim();
  const normalized = text.toLowerCase();

  let intent = "待判断";
  let status = "待人工分类";
  let nextAction = "人工查看并标记客户意图";

  if (/(price|quote|quotation|moq|catalog|报价|价格|多少钱|目录)/i.test(normalized)) {
    intent = "询价";
    status = "待报价";
    nextAction = "补充产品参数并报价";
  }
  if (/(order|purchase|buy|订单|下单|购买)/i.test(normalized)) {
    intent = "订单/购买";
    status = "待确认订单";
    nextAction = "确认数量、收货信息和付款方式";
  }
  if (/(shipping|delivery|cif|物流|发货|运费)/i.test(normalized) && intent === "待判断") {
    intent = "物流";
    status = "待核算物流";
    nextAction = "核实目的地、重量体积和运输方式";
  }
  if (/(sample|样品)/i.test(normalized) && intent === "待判断") {
    intent = "样品";
    status = "待确认样品";
    nextAction = "确认样品规格和寄送信息";
  }

  return {
    needSummary: summarizeNeed(text, intent),
    product: productSummary(text),
    quantity: quantitySummary(text),
    intent,
    status,
    nextAction,
  };
}

function summarizeNeed(text: string, intent: string): string {
  const shortText = text.length > 100 ? `${text.slice(0, 97)}...` : text;
  if (!shortText) return "无";
  if (intent === "询价") return `需要报价：${shortText}`;
  if (intent === "订单/购买") return `订单跟进：${shortText}`;
  if (intent === "物流") return `物流咨询：${shortText}`;
  if (intent === "样品") return `样品需求：${shortText}`;
  return shortText;
}

function productSummary(text: string): string {
  const products = new Set<string>();
  const tests: Array<[string, RegExp]> = [
    ["solar panels", /solar panel|550w|panel|光伏板|太阳能板/i],
    ["lithium battery 48V 100Ah", /48v|100ah|lithium battery|锂电池/i],
    ["home inverter", /inverter|5kw|hybrid inverter|逆变器/i],
    ["battery storage", /battery storage|storage|储能/i],
  ];

  for (const [label, pattern] of tests) {
    if (pattern.test(text)) products.add(label);
  }

  return products.size ? Array.from(products).join("; ") : "无";
}

function quantitySummary(text: string): string {
  const matches = new Set<string>();
  const regexes = [
    /\b\d+\s*(?:pieces|pcs|sets|units|piece|pc|set|unit)\b/gi,
    /\b\d+\s+\w+\s+(?:pieces|pcs|sets|units|piece|pc|set|unit)\b/gi,
    /\b\d+\s*(?:件|套|台|个)\b/gi,
  ];

  for (const regex of regexes) {
    for (const match of text.matchAll(regex)) {
      matches.add(match[0]);
    }
  }

  return matches.size ? Array.from(matches).join("; ") : "无";
}
