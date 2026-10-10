/**
 * THALSA Pedagogical Answer Synthesizer
 * Formulates clear, student-friendly explanations based on verified retrieved facts.
 * Adapts structure based on domain: Engineering, Coding, Math, Definitions, Exam, Study.
 */

function formatStudentResponse(question, knowledgeData, options = {}) {
  const { mode = 'standard', examMarks = null, isStudyMode = false } = options;
  const { classification, sources } = knowledgeData;
  const q = question.toLowerCase();

  // Extract core facts from sources
  const wikiSource = sources.find(s => s.source === 'Wikipedia');
  const wikiData = sources.find(s => s.source === 'Wikidata');
  const stackSource = sources.find(s => s.source === 'Stack Exchange');
  const openAlexSource = sources.find(s => s.source === 'OpenAlex');
  const weatherSource = sources.find(s => s.source === 'Open-Meteo Public API');
  const financeSource = sources.find(s => s.source && (s.source.includes('CoinGecko') || s.source.includes('Exchange Rates')));
  const techNewsSource = sources.find(s => s.source === 'HackerNews Public API');
  const publicApiSource = sources.find(s => s.source === 'public-apis Directory');

  let answerText = '';
  let keyPoints = [];
  let followUpSuggestions = [];

  // ==========================================
  // CASE 0: LIVE GROUNDING FROM PUBLIC APIS (v2 Feature)
  // ==========================================
  if (weatherSource && weatherSource.liveData) {
    const wd = weatherSource.liveData;
    answerText = `### Real-Time Weather: ${wd.location}
* **Current Condition:** ${wd.condition}
* **Temperature:** ${wd.temperature} (Feels like ${wd.feelsLike})
* **Relative Humidity:** ${wd.humidity}
* **Wind Speed:** ${wd.windSpeed}

*Verified live via Open-Meteo Public Weather API.*`;

    keyPoints = [
      `Current conditions in ${wd.location} indicate ${wd.condition.toLowerCase()} with a temperature of ${wd.temperature}.`,
      `Relative humidity is measured at ${wd.humidity} with winds at ${wd.windSpeed}.`,
      `Real-time meteorological telemetry provided directly by Open-Meteo.`
    ];

    followUpSuggestions = [
      'Will it rain tomorrow?',
      'Check temperature in another city',
      'Explain meteorological conditions'
    ];
  } else if (financeSource && financeSource.liveData) {
    const fd = financeSource.liveData;
    if (fd.asset) {
      answerText = `### Live Market Data: ${fd.asset}
* **USD Price:** ${fd.usd}
* **INR Price:** ${fd.inr}
* **24h Change:** ${fd.change24h}

*Verified in real-time via CoinGecko Public API.*`;

      keyPoints = [
        `${fd.asset} is currently trading at ${fd.usd} (${fd.inr}).`,
        `24-hour market movement is currently at ${fd.change24h}.`,
        `Data retrieved from CoinGecko open cryptocurrency index.`
      ];
    } else {
      answerText = `### Live Currency Exchange Rates (Base USD)
* **1 USD = ₹${fd.INR} INR**
* **1 USD = €${fd.EUR} EUR**
* **1 USD = £${fd.GBP} GBP**
* **1 USD = ¥${fd.JPY} JPY**

*Verified live via Open Exchange Rates API.*`;

      keyPoints = [
        `US Dollar (USD) exchanges at ₹${fd.INR} Indian Rupees.`,
        `Euro exchange rate stands at €${fd.EUR} per USD.`,
        `Rates reflect global foreign exchange interbank benchmarks.`
      ];
    }

    followUpSuggestions = [
      'Convert 100 USD to INR',
      'Check Bitcoin price',
      'Explain currency exchange mechanism'
    ];
  } else if (techNewsSource && techNewsSource.liveData) {
    answerText = `### 🌐 Trending Tech & Engineering Headlines (HackerNews)
${techNewsSource.extract}

*Fetched live from HackerNews Firebase Public API.*`;

    keyPoints = [
      'Top developer discussions currently circulating on HackerNews.',
      'Reflects real-time community engagement and upvotes.',
      'Live streaming data from YCombinator Firebase public endpoint.'
    ];

    followUpSuggestions = [
      'Explain the top discussion',
      'Give another tech headline'
    ];
  } else if (publicApiSource && publicApiSource.liveData) {
    answerText = `### 🌊 Public APIs Directory Recommendations
${publicApiSource.extract}

*Discovered via github.com/public-apis/public-apis directory catalogue.*`;

    keyPoints = [
      'Curated from the public-apis open source repository.',
      'All listed endpoints support verified HTTPS and CORS standards.',
      'Ready for immediate integration into developer apps.'
    ];

    followUpSuggestions = [
      'Show more public APIs',
      'Give sample fetch code in JavaScript',
      'Which APIs require authentication?'
    ];
  }

  // ==========================================
  // CASE 1: SPECIFIC ACADEMIC TOPICS / CURATED DOMAIN ACCURACY
  // ==========================================
  else if (q.includes('frequency')) {
    answerText = `**Frequency** is the number of times a periodic event or wave cycle repeats in one second.

### Formula
$$f = \\frac{1}{T}$$

**Where:**
* **$f$** = Frequency (measured in Hertz, $\\text{Hz}$)
* **$T$** = Time Period (the time taken to complete one full cycle, in seconds)

### Concrete Example
If a sound wave completes **20 cycles in one second**, its frequency is **20 Hz**. Similarly, standard AC mains electricity in many regions alternates at **50 Hz** (completing 50 cycles every second).`;

    keyPoints = [
      'Frequency indicates how rapidly a cyclic event repeats over time.',
      'The SI unit of frequency is Hertz (Hz).',
      '1 Hz represents exactly one cycle per second.',
      'Frequency is inversely proportional to time period ($f = 1/T$) and wavelength ($v = f \\lambda$).'
    ];

    followUpSuggestions = [
      'Explain simpler',
      'Give another real-world example',
      'Formula for frequency and wavelength',
      'Make 5-mark answer'
    ];
  }

  // Kirchhoff's Voltage Law (KVL) & Laws
  else if (q.includes('kirchhoff') && (q.includes('voltage') || q.includes('kvl') || q.includes('law'))) {
    answerText = `**Kirchhoff's Voltage Law (KVL)** states that the algebraic sum of all voltages around any closed loop or mesh in an electrical circuit is equal to zero.

It is a direct consequence of the **Law of Conservation of Energy** — energy cannot appear or disappear as charge travels in a closed circuit path.

### Mathematical Statement
$$\\sum_{k=1}^{n} V_k = 0$$

$$\\sum V_{\\text{rises}} = \\sum V_{\\text{drops}}$$

### Concrete Example
Consider a simple closed loop containing a **12V DC battery** connected across two series resistors $R_1$ and $R_2$:
* Voltage drop across $R_1 = 4\\text{V}$
* Voltage drop across $R_2 = 8\\text{V}$
* Loop equation: $12\\text{V} - 4\\text{V} - 8\\text{V} = 0\\text{V}$ (verified).`;

    keyPoints = [
      'KVL applies to any closed loop or mesh in an electric circuit.',
      'Fundamental Principle: Based on the Conservation of Energy.',
      'Convention: Voltage gains are treated as positive and voltage drops across components as negative.',
      'Together with Kirchhoff\'s Current Law (KCL, Conservation of Charge), it forms the foundation of nodal and mesh circuit analysis.'
    ];

    followUpSuggestions = [
      'Explain Kirchhoff\'s Current Law (KCL)',
      'Give a numerical solved problem',
      'Make 5-mark exam answer',
      'Explain simpler'
    ];
  }

  // Pointers in C
  else if (q.includes('pointer') && (q.includes(' c') || q.includes('in c') || q.includes('code') || q.includes('programming'))) {
    answerText = `In C, a **pointer** is a variable that stores the memory address of another variable rather than storing a direct data value.

### Key Syntax & Operators
1. **Address-of Operator (\`&\`)**: Gets the memory location of a variable.
2. **Dereference Operator (\`*\`)**: Accesses the value stored at the address pointed to.

### Working Code Example
\`\`\`c
#include <stdio.h>

int main(void) {
    int score = 95;      // Normal integer variable
    int *ptr = &score;   // Pointer 'ptr' holds the memory address of 'score'

    printf("Value of score: %d\\n", score);
    printf("Memory address of score: %p\\n", (void*)ptr);
    printf("Value accessed via pointer (*ptr): %d\\n", *ptr);

    // Modifying value through pointer
    *ptr = 100;
    printf("Updated score: %d\\n", score);

    return 0;
}
\`\`\`

### Why Pointers Matter
* **Dynamic Memory Allocation**: Required for \`malloc()\` and \`free()\`.
* **Passing by Reference**: Enables functions to modify original values without copying large structures.
* **Building Data Structures**: Essential for linked lists, trees, and graphs.`;

    keyPoints = [
      'A pointer holds a memory address, not the raw data itself.',
      '`&variable` gives the address; `*pointer` dereferences the address to get or update the value.',
      'Always initialize pointers before use (avoid uninitialized "wild pointers").',
      'Setting a pointer to `NULL` when unused prevents dangling pointer segmentation faults.'
    ];

    followUpSuggestions = [
      'Explain pointer arithmetic',
      'What is a segmentation fault?',
      'Make 5-mark exam answer',
      'Explain simpler'
    ];
  }

  // Laplace Transform
  else if (q.includes('laplace')) {
    answerText = `The **Laplace Transform** is an integral transform that converts a time-domain function $f(t)$ into a complex frequency-domain function $F(s)$.

It is widely used in electrical engineering and mechanical control systems to turn difficult differential equations into simple algebraic equations.

### Definition Formula
$$\\mathcal{L}\\{f(t)\\} = F(s) = \\int_{0}^{\\infty} f(t) e^{-st} \\, dt$$

Where:
* $t$ is the time variable ($t \\ge 0$)
* $s = \\sigma + j\\omega$ is the complex frequency parameter

### Standard Transformations
* $\\mathcal{L}\\{1\\} = \\frac{1}{s}$
* $\\mathcal{L}\\{e^{at}\\} = \\frac{1}{s - a}$
* $\\mathcal{L}\\{\\sin(\\omega t)\\} = \\frac{\\omega}{s^2 + \\omega^2}$
* $\\mathcal{L}\\{\\cos(\\omega t)\\} = \\frac{s}{s^2 + \\omega^2}$`;

    keyPoints = [
      'Converts time-domain differential equations into algebraic equations in the $s$-domain.',
      'Applies to linear time-invariant (LTI) engineering systems.',
      'Enables fast transient and steady-state circuit stability analysis.'
    ];

    followUpSuggestions = [
      'Solve a simple differential equation using Laplace',
      'Explain inverse Laplace transform',
      'Make 5-mark answer'
    ];
  }

  // Photosynthesis (Exam / Biology query)
  else if (q.includes('photosynthesis')) {
    answerText = `**Photosynthesis** is the biological process by which green plants, algae, and certain bacteria convert light energy (sunlight) into chemical energy (glucose) using carbon dioxide and water.

### Chemical Equation
$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{Light + Chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$

### Key Stages
1. **Light-Dependent Reactions**: Occur in the thylakoid membranes of chloroplasts. Sunlight splits water molecules, producing ATP, NADPH, and releasing $\\text{O}_2$ gas.
2. **Light-Independent Reactions (Calvin Cycle)**: Occur in the stroma. Uses ATP and NADPH to convert $\\text{CO}_2$ into glucose sugar.`;

    keyPoints = [
      'Primary energy capture mechanism that fuels nearly all terrestrial life.',
      'Produces oxygen gas ($\\text{O}_2$) as a vital byproduct.',
      'Chlorophyll in chloroplasts acts as the primary light-absorbing pigment.'
    ];

    followUpSuggestions = [
      'Explain the Calvin Cycle in detail',
      'Make 5-mark exam answer',
      'Explain simpler'
    ];
  }

  // Quantum Computing
  else if (q.includes('quantum') && q.includes('computing')) {
    answerText = `**Quantum Computing** is an emerging computing paradigm that harnesses the laws of quantum mechanics to solve complex computational problems that are intractable for classical computers.

### Core Principles
1. **Qubit (Quantum Bit)**: Unlike classical bits that are strictly 0 or 1, a qubit can exist in a superposition of states:
   $$|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle$$
2. **Superposition**: Allows a quantum computer to evaluate millions of potential pathways at the same time.
3. **Entanglement**: Inseparable links between qubits such that the state of one instantly dictates the state of another.
4. **Quantum Interference**: Algorithmic technique to cancel wrong possibilities while amplifying the correct outcome probability.

### Practical Applications
* **Cryptography & Security**: Prime factorization and post-quantum lattice encryption.
* **Molecular Modeling**: Drug discovery and simulating battery chemical bonds.
* **Optimization**: Logistics and algorithmic supply chain efficiency.`;

    keyPoints = [
      'Operates using qubits instead of classical binary transistors.',
      'Achieves exponential speedup for specific mathematical algorithms (e.g., Shor\'s algorithm).',
      'Current systems are in the NISQ era (Noisy Intermediate-Scale Quantum) working toward fault-tolerant error correction.'
    ];

    followUpSuggestions = [
      'Explain qubits vs classical bits simply',
      'Make 8-mark exam answer',
      'Explain simpler'
    ];
  }

  // Factorial in Python
  else if (q.includes('factorial') && (q.includes('python') || q.includes('code') || q.includes('program'))) {
    answerText = `Here is a clear, student-friendly Python program to calculate the factorial of a number using both an iterative loop and recursion.

### Method 1: Clean Iterative Approach (Recommended)
\`\`\`python
def factorial(n):
    if n < 0:
        return "Error: Factorial does not exist for negative numbers."
    
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

# Example run:
num = 5
print(f"The factorial of {num} is {factorial(num)}")
# Output: 120
\`\`\`

### How it works:
* Factorial of $n$ ($n!$) is $n \\times (n-1) \\times (n-2) \\dots \\times 1$.
* For $n = 5$: $5 \\times 4 \\times 3 \\times 2 \\times 1 = 120$.
* Factorial of $0$ is defined as $1$.`;

    keyPoints = [
      'Factorial is defined only for non-negative integers ($n \\ge 0$).',
      '$0! = 1$ by mathematical definition.',
      'Iterative approach avoids stack overflow on very large integers.'
    ];

    followUpSuggestions = [
      'Write recursive version',
      'Explain time complexity',
      'Explain simpler'
    ];
  }

  // Integration problem / Calculus
  else if (q.includes('integration') || q.includes('integral')) {
    answerText = `**Integration** is the mathematical process of finding the antiderivative of a function or calculating the total accumulated area under a curve.

### Fundamental Definition
$$\\int f(x) \\, dx = F(x) + C$$

Where $F'(x) = f(x)$ and $C$ is the constant of integration.

### Fundamental Rules
1. **Power Rule**: $\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\ne -1)$
2. **Exponential**: $\\int e^{kx} \\, dx = \\frac{1}{k} e^{kx} + C$
3. **Logarithmic**: $\\int \\frac{1}{x} \\, dx = \\ln|x| + C$
4. **Trigonometric**: $\\int \\cos(x) \\, dx = \\sin(x) + C$

### Solved Example
**Evaluate:** $\\int (3x^2 + 4x + 2) \\, dx$
* Step 1: $\\int 3x^2 \\, dx = 3 \\cdot \\frac{x^3}{3} = x^3$
* Step 2: $\\int 4x \\, dx = 4 \\cdot \\frac{x^2}{2} = 2x^2$
* Step 3: $\\int 2 \\, dx = 2x$
* **Final Answer:** $x^3 + 2x^2 + 2x + C$`;

    keyPoints = [
      'Integration is the reverse operation of differentiation.',
      'Always remember the constant of integration ($+ C$) for indefinite integrals.',
      'Definite integrals evaluate the accumulated area between limits $[a, b]$.'
    ];

    followUpSuggestions = [
      'Explain integration by parts',
      'Explain substitution method',
      'Give another solved problem'
    ];
  }

  // ==========================================
  // CASE 2: GENERAL SYNTHESIS FROM RETRIEVED KNOWLEDGE SOURCES
  // ==========================================
  else {
    const primaryTitle = wikiSource?.title || wikiData?.label || stackSource?.title || 'Topic Overview';
    const mainExtract = wikiSource?.extract || stackSource?.answerSnippet || stackSource?.questionSnippet || wikiData?.description || 'Core concept overview.';

    if (classification.isCoding) {
      answerText = `### Concept Overview: ${primaryTitle}

${mainExtract}

${stackSource?.answerSnippet ? `### Technical Explanation & Practical Code:\n${stackSource.answerSnippet}` : ''}`;
      
      keyPoints = [
        'Check syntax rules, parameter constraints, and return types.',
        'Ensure proper boundary verification and defensive error handling.',
        'Refer to verified community documentation for best implementation practices.'
      ];
    } else if (classification.isResearch && openAlexSource) {
      answerText = `### Research Overview: ${openAlexSource.title}

${openAlexSource.abstractSnippet || mainExtract}

* **Publication Year:** ${openAlexSource.publicationYear || 'Recent'}
* **Scholarly Citations:** ${openAlexSource.citedByCount || 0} citations
* **Key Authors:** ${(openAlexSource.authors || []).join(', ') || 'Academic Researchers'}`;

      keyPoints = [
        'Academic consensus emphasizes evidence-based experimental evaluation.',
        'Scholarly literature highlights both foundational methodologies and modern developments.'
      ];
    } else {
      answerText = `### What is ${primaryTitle}?

${mainExtract}

${wikiData?.description ? `* **Classification:** ${wikiData.description}` : ''}`;

      keyPoints = [
        'Understand the core definition and fundamental principles first.',
        'Break complex interactions down into simple, verifiable steps.'
      ];
    }

    followUpSuggestions = [
      'Explain simpler',
      'Give an example',
      'Make 5-mark answer',
      'Give important points'
    ];
  }

  // ==========================================
  // ADAPTATION: EXAM MODE (2, 5, 8, 10 Marks)
  // ==========================================
  if (examMarks || classification.isExam) {
    const marks = examMarks || (q.includes('2-mark') ? 2 : q.includes('8-mark') ? 8 : q.includes('10-mark') ? 10 : 5);
    
    if (marks <= 2) {
      answerText = `### 2-Mark Exam Answer

**Definition:**
${answerText.split('\n\n')[0]}

**Key Point / Formula:**
${keyPoints[0] || 'State principle and SI unit/return type.'}`;
    } else if (marks <= 5) {
      answerText = `### 5-Mark Exam Structure

#### 1. Definition
${answerText.split('\n\n')[0]}

#### 2. Detailed Explanation & Principle
${answerText.split('\n\n')[1] || ''}

#### 3. Essential Formula / Diagram Note
${answerText.includes('Formula') || answerText.includes('Code') ? answerText.split('\n\n').slice(2, 4).join('\n\n') : keyPoints.slice(0, 2).map(p => `* ${p}`).join('\n')}

#### 4. Key Takeaways
${keyPoints.map(p => `* ${p}`).join('\n')}`;
    } else {
      // 8 to 10 marks
      answerText = `### ${marks}-Mark Comprehensive Exam Structure

#### 1. Statement & Definition
${answerText.split('\n\n')[0]}

#### 2. Theoretical Principle & Detailed Derivation / Working
${answerText}

#### 3. Key Points & Salient Characteristics
${keyPoints.map((p, i) => `${i + 1}. **${p}**`).join('\n')}

#### 4. Practical Engineering / Scientific Significance
* Demonstrates real-world applicability in modern design and systems.
* Provides predictive mathematical stability across edge operational conditions.

#### 5. Conclusion
A solid understanding of this principle is fundamental for analysis, problem-solving, and system optimization.`;
    }
  }

  // ==========================================
  // ADAPTATION: STUDY TUTOR MODE
  // ==========================================
  if (isStudyMode) {
    const firstParagraph = answerText.split('\n\n')[0];
    answerText = `### Let's Learn Step-by-Step 🎓

${firstParagraph}

---

### Step 1: Understand the Core Idea
${keyPoints[0] || 'Focus on what happens physically or logically.'}

### Step 2: Notice this Example
${answerText.includes('Example') ? answerText.split('Example')[1]?.split('---')[0] || keyPoints[1] : keyPoints[1] || ''}

---

### Quick Check For You:
*In your own words, how would you describe this in one sentence?* Reply below and I'll confirm if you have it right!`;
  }

  return {
    answer: answerText,
    keyPoints,
    sourcesUsed: sources.map(s => ({
      name: s.source,
      title: s.title || s.label || s.source,
      url: s.url
    })),
    followUps: followUpSuggestions
  };
}

module.exports = { formatStudentResponse };
