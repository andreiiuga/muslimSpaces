import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AwliaResponse, DayCount, HelpResponse, MeResponse, SalawatResponse, StatsResponse } from '../dispatcher/types.js';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

import presenter from './index.js';

function respondWithJson(json: object): void {
  mockCreate.mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify(json) }] });
}

function respondWithText(text: string): void {
  mockCreate.mockResolvedValue({ content: [{ type: 'text', text }] });
}

// Mirrors the private renderBar in presenter/index.ts, needed to predict the
// exact bar lines the presenter builds before handing them to (mocked) Claude.
const BAR_WIDTH = 10;
function renderBar(count: number, max: number): string {
  const filled = max === 0 ? 0 : Math.round((count / max) * BAR_WIDTH);
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe('salawat acknowledgement', () => {
  const response: SalawatResponse = {
    type: 'salawat',
    user: { id: 1, name: 'Amina', phoneNumber: '123' },
    count: 50,
    total: 150,
    goal: 100000,
  };

  it('includes the progress header and every language when Claude returns a full translation set', async () => {
    respondWithJson({ en: 'Great job!', ar: 'أحسنت', ro: 'Bravo', ur: 'شاباش', bn: 'সাবাশ' });

    const text = await presenter.processResponse(response);

    expect(text.startsWith('150/100000')).toBe(true);
    expect(text).toContain('🇬🇧 Great job!');
    expect(text).toContain('🇸🇦 أحسنت');
    expect(text).toContain('🇷🇴 Bravo');
    expect(text).toContain('🇵🇰 شاباش');
    expect(text).toContain('🇧🇩 সাবাশ');
  });

  it('falls back to the hardcoded message when a language is missing', async () => {
    respondWithJson({ en: 'Great job!', ar: 'أحسنت' });

    const text = await presenter.processResponse(response);

    expect(text).toContain('JazakAllah khair, keep going! 🌙');
  });

  it('falls back to the hardcoded message when the API call throws', async () => {
    mockCreate.mockRejectedValue(new Error('network error'));

    const text = await presenter.processResponse(response);

    expect(text).toContain('150/100000');
    expect(text).toContain('JazakAllah khair, keep going! 🌙');
  });
});

describe('/me', () => {
  it("tells the sender they haven't submitted anything yet", async () => {
    const response: MeResponse = {
      type: 'me',
      user: { id: 1, name: 'Amina', phoneNumber: '123' },
      submissions: [],
      total: 0,
    };

    const text = await presenter.processResponse(response);

    expect(text).toBe("Amina haven't submitted any salawat yet.");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('truncates to the first 20 submissions and notes how many more there are', async () => {
    const submissions = Array.from({ length: 22 }, (_, i) => ({
      count: 1,
      submittedAt: new Date(2026, 0, i + 1),
    }));
    const response: MeResponse = {
      type: 'me',
      user: { id: 1, name: 'Amina', phoneNumber: '123' },
      submissions,
      total: 22,
    };

    const text = await presenter.processResponse(response);
    const lines = text.split('\n');

    expect(lines[0]).toBe('Your submissions (total: 22):');
    expect(lines).toHaveLength(1 + 20 + 1);
    expect(lines.at(-1)).toBe('…and 2 more');
  });

  it('shows no "more" line when submissions fit within the limit', async () => {
    const submissions = Array.from({ length: 3 }, (_, i) => ({
      count: 1,
      submittedAt: new Date(2026, 0, i + 1),
    }));
    const response: MeResponse = {
      type: 'me',
      user: { id: 1, name: null, phoneNumber: '123' },
      submissions,
      total: 3,
    };

    const text = await presenter.processResponse(response);
    const lines = text.split('\n');

    expect(lines).toHaveLength(1 + 3);
    expect(lines.at(-1)).not.toContain('more');
  });
});

describe('/stats', () => {
  const distribution: DayCount[] = [
    { day: 'Mon', count: 8 },
    { day: 'Tue', count: 10 },
    { day: 'Wed', count: 0 },
    { day: 'Thu', count: 3 },
    { day: 'Fri', count: 5 },
    { day: 'Sat', count: 6 },
    { day: 'Sun', count: 2 },
  ];
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(...distribution.map((d) => d.count), 1);
  const barLines = distribution.map((d) => `${d.day} ${renderBar(d.count, max)} ${d.count}`);
  const response: StatsResponse = { type: 'stats', distribution, total };

  it("passes Claude's message through unchanged when the bar lines are preserved", async () => {
    const claudeText = ['📈 Salawat so far', ...barLines, '─'.repeat(16), `Total: ${total}`, 'Keep it up! 🌙'].join(
      '\n',
    );
    respondWithText(claudeText);

    const text = await presenter.processResponse(response);

    expect(text).toBe(claudeText);
  });

  it('falls back to the hardcoded template when Claude drops/alters a bar line', async () => {
    respondWithText('Some unrelated response without bar lines');

    const text = await presenter.processResponse(response);

    const expectedFallback = [
      'All-time salawat by day',
      ...barLines,
      '─'.repeat(16),
      `Total: ${total}`,
      'Keep it up! 🌙',
    ].join('\n');
    expect(text).toBe(expectedFallback);
  });

  it('falls back to the hardcoded template when the API call throws', async () => {
    mockCreate.mockRejectedValue(new Error('network error'));

    const text = await presenter.processResponse(response);

    expect(text).toContain(`Total: ${total}`);
    barLines.forEach((line) => expect(text).toContain(line));
  });
});

describe('/help', () => {
  it('renders a static bilingual command list without calling the API', async () => {
    const response: HelpResponse = { type: 'help', goal: 100000 };

    const text = await presenter.processResponse(response);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(text).toContain('🇬🇧 English');
    expect(text).toContain('🇸🇦 العربية');
    expect(text).toContain('/stats');
    expect(text).toContain('/me');
    expect(text).toContain('/awlia');
    expect(text).toContain('/help');
    expect(text).toContain('100,000');
  });
});

describe('/awlia', () => {
  it('lists every user in the given order, falling back to phone number when no name is set', async () => {
    const response: AwliaResponse = {
      type: 'awlia',
      users: [
        { name: 'Amina', phoneNumber: '111' },
        { name: null, phoneNumber: '222' },
      ],
    };

    const text = await presenter.processResponse(response);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(text).toContain('1. Amina');
    expect(text).toContain('2. 222');
    expect(text).toContain('random order');
  });

  it('shows a bilingual empty-state message when no one has submitted yet', async () => {
    const response: AwliaResponse = { type: 'awlia', users: [] };

    const text = await presenter.processResponse(response);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(text).toContain('No one has submitted');
    expect(text).toContain('لم يشارك أحد بعد');
  });
});
