$path = "c:\Users\DenisMay\elite-finder-appv1\frontend\src\components\AgentBuilder.tsx"
$content = Get-Content $path -Raw

# 1. Interface Prompts
$content = $content -replace "        validation: string;", "        validation: string;`r`n        scriptContent?: string;"

# 2. Interface AdvancedConfig
$content = $content -replace "    advancedConfig\?: \{", "    advancedConfig?: {`r`n        kpis?: { name: string; target: string }[];"

# 3. INITIAL_CONFIG Prompts (Target the one in INITIAL_CONFIG specifically if possible, or both)
# The interface one is "prompts: {" followed by type. The config one is "prompts: {" followed by value.
# But replacing "prompts: {" works for both if I am careful.
# Wait, replacing "prompts: {" in Interface will result in:
# prompts: {
#   scriptContent: '',
#   system: string;
# This is invalid TS (mixing value assignment in type def).
# So I must distinguish.

# Interface: "    prompts: {" followed by newline and spaces and "system: string;"
# Config: "    prompts: {" followed by newline and spaces and "system: '',"

# I will use more context.
$content = $content -replace "        validation: string;`r`n    \};", "        validation: string;`r`n        scriptContent?: string;`r`n    };"

# For Initial Config Prompts:
$content = $content -replace "    prompts: \{`r`n        system: '',", "    prompts: {`r`n        scriptContent: '',`r`n        system: '',"

# For Initial Config Advanced:
$content = $content -replace "    advancedConfig: \{`r`n        multiModelValidation: \{", "    advancedConfig: {`r`n        kpis: [],`r`n        multiModelValidation: {"

# 5. TABS
$content = $content -replace "        \{ id: 'advanced', label: 'Otimização Avançada', icon: Zap \},", "        { id: 'advanced', label: 'Otimização Avançada', icon: Zap },`r`n        { id: 'deploy', label: 'Deploy & Widget', icon: LayoutTemplate },"

# 6. activeTab
$content = $content -replace "\| 'advanced'>\('identity'\)", "| 'advanced' | 'deploy'>('identity')"

Set-Content -Path $path -Value $content
