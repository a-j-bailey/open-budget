import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useThemeContext } from '../contexts/ThemeContext'
import type { Theme } from '../hooks/useTheme'
import { useRules } from '../hooks/useRules'
import { useBudget } from '../hooks/useBudget'
import { pushCloudSnapshot, syncFromCloudIfAvailable } from '../lib/cloudSync'

type TabId = 'settings' | 'rules' | 'budget'

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('settings')
  const { theme, setTheme } = useThemeContext()
  const { rules, addRule, removeRule } = useRules()
  const { categories, addCategory, updateCategory, removeCategory } = useBudget()

  const [pattern, setPattern] = useState('')
  const [source, setSource] = useState<'description' | 'category'>('description')
  const [targetCategoryId, setTargetCategoryId] = useState<string>('ignore')

  const [newName, setNewName] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [viewMode, setViewMode] = useState<'debit' | 'credit'>('debit')

  const visibleCategories = useMemo(
    () => categories.filter((c) => (viewMode === 'credit' ? c.type === 'income' : (c.type ?? 'expense') === 'expense')),
    [categories, viewMode]
  )

  const setThemeValue = (value: Theme) => setTheme(value)

  const handleAddRule = () => {
    const p = pattern.trim()
    if (!p) return
    addRule({ pattern: p, source, targetCategoryId })
    setPattern('')
  }

  const handleAddCategory = () => {
    const name = newName.trim()
    const limit = parseFloat(newLimit)
    if (!name || Number.isNaN(limit) || limit < 0) return
    addCategory(name, limit, viewMode === 'credit' ? 'income' : 'expense')
    setNewName('')
    setNewLimit('')
  }

  return (
    <ScrollView className="flex-1 px-4 py-4">
      <Text className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Settings</Text>

      <View className="mb-5 flex-row gap-2">
        {(['settings', 'rules', 'budget'] as TabId[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-2 ${activeTab === tab ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-900'}`}
          >
            <Text className="capitalize text-zinc-700 dark:text-zinc-200">{tab}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'settings' ? (
        <View className="gap-4">
          <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">Appearance</Text>
            <View className="flex-row gap-2">
              {(['light', 'dark', 'system'] as Theme[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setThemeValue(option)}
                  className={`rounded-lg px-3 py-2 ${theme === option ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                >
                  <Text className={theme === option ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">iCloud Sync</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => pushCloudSnapshot()}
                className="rounded-lg bg-blue-600 px-3 py-2"
              >
                <Text className="text-white">Push to iCloud</Text>
              </Pressable>
              <Pressable
                onPress={() => syncFromCloudIfAvailable()}
                className="rounded-lg bg-emerald-600 px-3 py-2"
              >
                <Text className="text-white">Pull from iCloud</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {activeTab === 'rules' ? (
        <View className="gap-4">
          <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">Add rule</Text>
            <TextInput
              value={pattern}
              onChangeText={setPattern}
              placeholder="e.g. Audible or /^AMZN/"
              className="mb-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
            <View className="mb-2 flex-row gap-2">
              <Pressable
                onPress={() => setSource('description')}
                className={`rounded-lg px-3 py-2 ${source === 'description' ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-900'}`}
              >
                <Text>Description</Text>
              </Pressable>
              <Pressable
                onPress={() => setSource('category')}
                className={`rounded-lg px-3 py-2 ${source === 'category' ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-900'}`}
              >
                <Text>Bank category</Text>
              </Pressable>
              <Pressable
                onPress={() => setTargetCategoryId('ignore')}
                className={`rounded-lg px-3 py-2 ${targetCategoryId === 'ignore' ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-900'}`}
              >
                <Text>Ignore</Text>
              </Pressable>
            </View>
            <ScrollView horizontal className="mb-2">
              <View className="flex-row gap-2">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setTargetCategoryId(cat.id)}
                    className={`rounded-full px-3 py-1 ${targetCategoryId === cat.id ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <Text className={targetCategoryId === cat.id ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Pressable onPress={handleAddRule} className="rounded-lg bg-blue-600 px-3 py-2">
              <Text className="text-center text-white">Add rule</Text>
            </Pressable>
          </View>

          {rules.map((rule) => (
            <View
              key={rule.id}
              className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{rule.pattern}</Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                match {rule.source} {'->'}{' '}
                {rule.targetCategoryId === 'ignore'
                  ? 'Ignore'
                  : categories.find((c) => c.id === rule.targetCategoryId)?.name ?? rule.targetCategoryId}
              </Text>
              <Pressable onPress={() => removeRule(rule.id)} className="mt-2 self-start rounded bg-red-600 px-2 py-1">
                <Text className="text-xs text-white">Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {activeTab === 'budget' ? (
        <View className="gap-4">
          <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="mb-2 flex-row gap-2">
              <Pressable
                onPress={() => setViewMode('debit')}
                className={`rounded-lg px-3 py-2 ${viewMode === 'debit' ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-900'}`}
              >
                <Text>Debit</Text>
              </Pressable>
              <Pressable
                onPress={() => setViewMode('credit')}
                className={`rounded-lg px-3 py-2 ${viewMode === 'credit' ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-900'}`}
              >
                <Text>Credit</Text>
              </Pressable>
            </View>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Category name"
              className="mb-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
            <TextInput
              value={newLimit}
              onChangeText={setNewLimit}
              keyboardType="decimal-pad"
              placeholder={viewMode === 'credit' ? 'Expected amount' : 'Monthly limit'}
              className="mb-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
            <Pressable onPress={handleAddCategory} className="rounded-lg bg-blue-600 px-3 py-2">
              <Text className="text-center text-white">Add category</Text>
            </Pressable>
          </View>

          {visibleCategories.map((cat) => (
            <View
              key={cat.id}
              className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <TextInput
                value={cat.name}
                onChangeText={(value) => updateCategory(cat.id, { name: value })}
                className="mb-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              />
              <TextInput
                value={String(cat.monthlyLimit)}
                onChangeText={(value) => {
                  const next = parseFloat(value)
                  if (!Number.isNaN(next) && next >= 0) updateCategory(cat.id, { monthlyLimit: next })
                }}
                keyboardType="decimal-pad"
                className="mb-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              />
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  {cat.type === 'income' ? 'Income category' : 'Expense category'}
                </Text>
                <Pressable onPress={() => removeCategory(cat.id)} className="rounded bg-red-600 px-2 py-1">
                  <Text className="text-xs text-white">Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}
