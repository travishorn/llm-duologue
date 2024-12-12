import { Readable } from "node:stream";
import ollama from "ollama";

/**
 * @typedef {object} Participant
 * @property {string} name
 * @property {string} model
 * @property {string} [system]
 */

/**
 * @typedef {object} Message
 * @property {string} role
 * @property {string} content
 */

/** @type {Message[]} */
let history = [];

/**
 * @param {Participant} pA
 * @param {Participant} pB
 * @param {string} topic
 * @returns {Readable}
 */
export function converse(pA, pB, topic) {
  async function* generateConversation() {
    const initialMessage = `Let's talk about ${topic}.`;

    yield `\x1b[34m\x1b[2m${pA.name}:\x1b[22m\n\n${initialMessage}\n\n\x1b[0m`;

    history.push({
      role: pA.name,
      content: initialMessage,
    });

    for (let i = 1; i < 99; i++) {
      const participant =
        history[history.length - 1].role === pA.name ? pB : pA;
      const otherParticipant = participant.name === pA.name ? pB : pA;
      const color = participant.name === pA.name ? "\x1b[34m" : "\x1b[33m";

      yield `${color}\x1b[2m${participant.name}:\x1b[22m\n\n`;

      const messages = history.map((m) => {
        return {
          role: m.role === otherParticipant.name ? "user" : "assistant",
          content: m.content,
        };
      });

      if (participant.system)
        messages.unshift({ role: "system", content: participant.system });

      const response = await ollama.chat({
        model: participant.model,
        messages,
        stream: true,
      });

      let content = "";

      for await (const part of response) {
        content += part.message.content;
        yield part.message.content;
      }

      history.push({
        role: participant.name,
        content,
      });

      yield "\n\n\x1b[0m";
    }
  }

  return Readable.from(generateConversation());
}
