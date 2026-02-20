import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { runMigrationFromFiles } from '../lib/migration'

export default function MigrateScreen() {
  const [status, setStatus] = useState<string>('Select your old files to migrate.')

  const run = async () => {
    setStatus('Selecting files...')
    const result = await runMigrationFromFiles()
    if (result.reason === 'canceled') {
      setStatus('Migration canceled.')
      return
    }
    if (result.reason === 'empty') {
      setStatus('No matching files found. Pick config.json, rules.json, and expenses CSV files.')
      return
    }
    setStatus('Migration complete. Your data is now in SQLite.')
  }

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Migrate Data</Text>
      <Text className="mb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Import existing config/rules JSON and monthly expense CSV files from the old desktop app.
      </Text>
      <Pressable onPress={run} className="rounded-xl bg-blue-600 px-5 py-3">
        <Text className="font-medium text-white">Select Files and Migrate</Text>
      </Pressable>
      <Text className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-300">{status}</Text>
    </View>
  )
}
