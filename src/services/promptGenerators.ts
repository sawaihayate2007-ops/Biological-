/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnowledgeCard, StandardProblem } from '../types';

/**
 * 6-1. 知識論述教材の生成プロンプト
 * 難関国公立大学受験生物レベルの知識論述カード群を階層構造で出力させる
 */
export function generateKnowledgeMaterialPrompt(params: {
  field: string;
  chapter?: string;
  theme?: string;
  difficulty?: string;
  numThemes?: number;
  additionalConditions?: string;
}): string {
  const {
    field = '分子生物学・遺伝情報',
    chapter = '第1章：原核生物の遺伝子発現調節',
    theme = 'テーマ01：ラクトースオペロンの誘導機構',
    difficulty = '難関国公立大二次試験レベル（東京大学・京都大学・東北大学・旧帝大・医学部等）',
    numThemes = 2,
    additionalConditions = '',
  } = params;

  return `あなたは大学受験生物、特に難関国公立大学二次試験（東大・京大・旧帝大・医学部）の記述・論述指導における最高峰の専門指導者・問題作成者です。

以下の指定条件に従い、学習システムへそのまま取り込み可能な【知識論述教材（Markdown形式）】を作成してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 生成対象の基本情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・生物の分野：${field}
・対象の章：${chapter}
・対象テーマ（または生成テーマ数）：${theme ? theme : `${numThemes}テーマ`}
・想定難易度：${difficulty}
${additionalConditions ? `・特記事項・条件：${additionalConditions}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 教材設計の必須要件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 【階層構造の厳守】
   教材は必ず以下の階層に従ってください。
   分野：〇〇
   第○章：〇〇
   テーマ○○：〇〇
   各テーマの下に、独立したカードを以下の4種類からバランスよく作成してください（1テーマあたり3〜5枚程度）。

2. 【4種類のカード種別（type）の定義】
   - basic (基本)：用語、定義、基本骨格を確認する（30〜60字程度）
   - understanding (理解)：現象のメカニズム、因果関係、発生・制御の機序を説明する（60〜100字程度）
   - application (応用)：条件変化、欠損変異株、実験結果の予測・解釈、比較論述（80〜120字程度）
   - comprehensive (総合論述)：複数の知識を統合した大学入試実戦問題。答案作成・論理構成を鍛える（100〜150字程度）

3. 【生物学的内容の厳密性】
   - 最新の生物学知見および高校学習指導要領・難関大二次試験の標準に合致すること。
   - 事実誤認、因果の飛躍、主語・客体の曖昧さを徹底排除すること。
   - 「なぜそうなるのか」という論理の鎖（因果連鎖）を明瞭にすること。
   - 採点者が減点しがちな「必要語句の欠落」をカバーする採点ポイントを明示すること。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 出力Markdownフォーマット規約（厳守）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
必ず以下の記法ルールに正確に従って出力してください。コードブロックや挨拶文・前置き・後書きは不要です。直接以下のMarkdownテキストのみを出力してください。

分野：${field}

${chapter}

${theme}

カード1
- 種類：basic
- 難易度：標準
- 指定字数：50字以内
- タイトル：[カードの要約タイトル]

問題
[論述問題文]

論述の骨組み
- [要点1：前提・現象]
- [要点2：機序・結論]

解答例
[模範解答文]

重要語句
- [必須キーワード1]
- [必須キーワード2]

採点ポイント
- [配点・採点項目1：〇〇に言及していること]
- [配点・採点項目2：〇〇と〇〇の因果関係が論理的であること]

解説
[補足解説、間違いやすいポイント、関連知識]

---

カード2
- 種類：understanding
- 難易度：標準
- 指定字数：80字以内
- タイトル：[カードタイトル]

問題
[問題文]

論述の骨組み
- [要点1]
- [要点2]

解答例
[模範解答]

重要語句
- [キーワード]

採点ポイント
- [採点ポイント]

解説
[解説]

---

（※以降、指定されたテーマおよびカードを続けて出力してください）
`;
}

/**
 * 6-3. 総合論述カードの外部AI採点プロンプト
 */
export function generateComprehensiveScoringPrompt(params: {
  card: KnowledgeCard;
  userAnswer: string;
}): string {
  const { card, userAnswer } = params;

  return `あなたは東京大学・京都大学をはじめとする難関国公立大学・難関医学部の生物二次試験の論述採点を担当する、極めて厳格かつ親身な最高峰の生物科採点委員です。

受験生が以下の「総合論述問題」に対して答案を作成しました。
提供された問題情報、模範解答、採点基準に基づき、客観的かつ建設的な詳細添削・採点を行ってください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 問題情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【分野・単元】${card.field} / ${card.chapter}
【テーマ】${card.theme}
【問題タイトル】${card.title}
【指定字数】${card.charLimit ? `${card.charLimit}字以内` : '指定なし（標準80〜120字程度）'}

【問題文】
${card.question}

【出題者が想定する論述の骨組み】
${card.framework && card.framework.length > 0 ? card.framework.map((f) => `・${f}`).join('\n') : '特になし'}

【模範解答】
${card.modelAnswer}

【重要キーワード・必須語句】
${card.keyTerms && card.keyTerms.length > 0 ? card.keyTerms.map((k) => `・${k}`).join('\n') : '特になし'}

【公式採点基準・減点回避要件】
${card.rubric && card.rubric.length > 0 ? card.rubric.map((r) => `・${r}`).join('\n') : '特になし'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 受験生の作成した答案（字数：${userAnswer.length}字）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
「${userAnswer}」

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 採点・添削の指示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
以下の観点で厳密に評価してください。
1. 生物学的事実の正確性・用語の誤用がないか
2. 必要な要素（因果関係・機序・結論）が過不足なく含まれているか
3. 日本語の論理構成（主語と述語の対応、指示語の明瞭さ）
4. 字数制限への適合性（指定がある場合）

評価結果は、以下の【採点結果フォーマット】に従ってMarkdownで出力してください。
前置きや結びの挨拶は省略し、以下のフォーマットのみを出力してください。

【採点結果フォーマット】

### 推定得点
[得点] / 10点 （または A/B/C/D 判定）

### 評価理由
[採点全体の総評と、この得点に至った根拠を客観的に記述]

### 良かった点
- [論理的に優れていた点や、正確に記述できているポイント1]
- [適切に使用された重要語句や因果の明快さ2]

### 不足点・減点箇所
- [不足している説明要素や、減点対象となる表現1]
- [因果関係の飛躍や補足すべき点2]

### 生物学的な誤り
- [誤認や不正確な記述があれば具体的に指摘（なければ「特になし」）]

### 改善答案
[受験生の答案の良い部分を活かしつつ、減点要素を解消した満点レベルのブラッシュアップ答案（字数も明記）]

### 次回の学習課題
[このテーマを完璧にするためのアドバイスや、関連して確認すべき生物学的機序]
`;
}

/**
 * 7. 通常の論述問題の外部AI採点プロンプト
 */
export function generateStandardProblemScoringPrompt(params: {
  problem: StandardProblem;
  userAnswer: string;
}): string {
  const { problem, userAnswer } = params;

  // 大問共通資料
  let commonMaterialsText = '';
  if (problem.commonMaterials && problem.commonMaterials.length > 0) {
    commonMaterialsText = problem.commonMaterials
      .map((block) => {
        if (block.type === 'heading') return `### ${block.content}`;
        if (block.type === 'table' && block.tableData) {
          const headers = block.tableData.headers.join(' | ');
          const divider = block.tableData.headers.map(() => '---').join(' | ');
          const rows = block.tableData.rows.map((r) => r.join(' | ')).join('\n');
          return `【表資料】${block.content || ''}\n| ${headers} |\n| ${divider} |\n${rows ? `| ${rows} |` : ''}`;
        }
        if (block.type === 'graph' && block.graphData) {
          return `【グラフ資料】${block.graphData.title}\nX軸: ${block.graphData.xAxisLabel || '項目'} (${block.graphData.labels.join(', ')})\n系列データ: ${block.graphData.series.map((s) => `${s.name}: [${s.values.join(', ')}]`).join('; ')}`;
        }
        return block.content;
      })
      .join('\n\n');
  }

  // 設問固有のコンテンツ
  const problemContentText = problem.contentBlocks
    .map((b) => {
      if (b.type === 'table' && b.tableData) {
        const headers = b.tableData.headers.join(' | ');
        const divider = b.tableData.headers.map(() => '---').join(' | ');
        const rows = b.tableData.rows.map((r) => r.join(' | ')).join('\n');
        return `| ${headers} |\n| ${divider} |\n${rows ? `| ${rows} |` : ''}`;
      }
      return b.content;
    })
    .join('\n\n');

  return `あなたは生物論述問題の採点基準を熟知した採点委員です。
以下の生物論述問題に対する受験生答案の客観的かつ厳格な採点・添削を行ってください。
※注意：大学名は一切使用せず、「作AI」として扱ってください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 出題情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出題】作AI
【問題タイトル】${problem.title}
【生物分野】${problem.field}
${problem.theme ? `【テーマ】${problem.theme}\n` : ''}${problem.tags && problem.tags.length > 0 ? `【タグ】${problem.tags.join(', ')}\n` : ''}【指定字数】${problem.charLimit ? `${problem.charLimit}字以内` : '指定なし'}
【配点】${problem.pointsAllocated ? `${problem.pointsAllocated}点満点` : '10点満点'}

${commonMaterialsText ? `【大問共通資料・実験背景】\n${commonMaterialsText}\n` : ''}
【設問文】
${problemContentText}

【模範解答】
${problem.modelAnswer}

【公式採点基準】
${problem.gradingRubric && problem.gradingRubric.length > 0 ? problem.gradingRubric.map((r) => `・${r}`).join('\n') : '過不足のない論理構成、重要因果の明記'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 受験生が作成した答案（字数：${userAnswer.length}字）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
「${userAnswer}」

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 採点・添削指示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
採点結果は以下のMarkdownフォーマットに厳密に従って出力してください。
前置きや挨拶文は一切不要です。大学名は一切記載しないでください。

### 推定得点
[得点] / ${problem.pointsAllocated || 10}点

### 評価理由
[採点根拠と全体のまとめ]

### 良かった点
- [加点された要素や、的確な表現]

### 不足点・減点箇所
- [不足している論述要素、減点された理由]

### 生物学的な誤り
- [誤認や不正確な箇所（なければ「特になし」）]

### 改善答案
[満点を獲得できるブラッシュアップ答案（字数付記）]

### 次回の学習課題
[この問題から学ぶべき入試生物の論述エッセンス]
`;
}

/**
 * 7. 通常の論述問題の新規生成プロンプト（作AI形式）
 */
export function generateStandardProblemCreationPrompt(params: {
  field: string;
  topic: string;
  tags?: string[];
  university?: string; // backwards compatibility if passed
  difficulty?: string;
}): string {
  const {
    field = '分子生物学・遺伝情報',
    topic = '真核生物のエピジェネティクスまたはスプライシング機構',
    tags = [],
  } = params;

  return `あなたは生物論述問題を作成する「作AI」です。
【重要厳守事項】大学名は一切書かないでください。出題元は「作AI」とし、特定の大学名は問題文・タイトル・タグ等も含め一切記載しないでください。

本格的な生物論述問題（実験考察・図表読取を含む記述論述問題）を作成してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 作問要件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・出題：作AI（大学名は一切書かないこと）
・分野：${field}
・テーマ・題材：${topic}
${tags.length > 0 ? `・指定タグ：${tags.join(', ')}` : ''}
・構成：
  1. リード文（実験背景・目的）
  2. 実験結果（表またはグラフ、実験データ）
  3. 設問（論述問題、字数指定：60〜100字程度）
  4. 模範解答と採点基準（配点付き）

出力は以下のMarkdownフォーマットに厳密に従ってください。コードブロックは不要です。
大学名、出題年度、学部・学科、試験区分、大問番号、小問番号、難易度は出力フォーマットに含めないでください。

出題：作AI
問題タイトル：[問題のタイトル]
分野：${field}
テーマ：[テーマ名]
指定字数：90字以内
タグ：${tags.length > 0 ? tags.join(', ') : '[単元名タグ, 関連タグ]'}
配点：10

【大問共通資料】
### 実験の背景と概要
[実験のリード文]

### 実験データ（表）
| 条件 | 処理 | 結果 | 備考 |
| --- | --- | --- | --- |
| 系統1 | 処理A | 100% | 正常 |
| 系統2 | 処理B | 15% | 抑制 |

【問題文】
[小問の問い文]

【論述の骨組み】
- [要点1]
- [要点2]

【模範解答】
[模範解答文]

【採点基準】
- [採点項目1（4点）]
- [採点項目2（4点）]
- [字数および論理構成（2点）]
`;
}
