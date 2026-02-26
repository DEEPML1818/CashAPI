const KEY = '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';

// Step 1: Test the exact model the user wants
async function testModel(model) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'CashApi'
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
            max_tokens: 50
        })
    });
    return res.json();
}

// Try the user's model first, then fallbacks
const modelsToTry = [
    'openai/gpt-4o-mini',
    'openai/gpt-4o-mini:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
];

for (const model of modelsToTry) {
    process.stdout.write(`Testing ${model}... `);
    try {
        const d = await testModel(model);
        if (d.error) {
            console.log(`❌ ${d.error.message.substring(0, 60)}`);
        } else {
            console.log(`✅ WORKS! Response: "${d.choices[0].message.content.trim().substring(0, 80)}"`);
            break;
        }
    } catch (e) {
        console.log(`❌ ${e.message}`);
    }
}
