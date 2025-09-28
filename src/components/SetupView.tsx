import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Bell, Loader2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettingsStore } from '@/store/settings-store';
import { api } from '@/lib/api-client';
import { GitHubRepo } from '@shared/types';
import { toast } from 'sonner';
interface SetupViewProps {
  onSetupComplete: (selectedRepo: string) => void;
}
export function SetupView({ onSetupComplete }: SetupViewProps) {
  const [token, setToken] = useState('');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const storeSetSelectedRepo = useSettingsStore(state => state.setSelectedRepo);
  const fetchRepos = async () => {
    if (!token) {
      toast.error('Please enter a GitHub Personal Access Token.');
      return;
    }
    setIsLoadingRepos(true);
    setRepos([]);
    setSelectedRepo(null);
    try {
      const data = await api<GitHubRepo[]>('/api/github/repos', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      setRepos(data);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while fetching repositories.');
    } finally {
      setIsLoadingRepos(false);
    }
  };
  const handleSave = async () => {
    if (!token || !selectedRepo) {
      toast.error('Please provide a token and select a repository.');
      return;
    }
    setIsSaving(true);
    storeSetSelectedRepo(selectedRepo);
    try {
      await onSetupComplete(selectedRepo);
    } catch (error) {
      // Error is handled in HomePage, but we still need to reset loading state
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-display">Configure OctoPulse</CardTitle>
          <CardDescription>Connect your GitHub account to start receiving notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center"><span className="bg-primary text-primary-foreground rounded-full h-6 w-6 text-sm font-bold flex items-center justify-center mr-2">1</span> Connect to GitHub</h3>
            <div className="space-y-2 pl-8">
              <Label htmlFor="github-pat">Personal Access Token</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="github-pat"
                  type="password"
                  placeholder="ghp_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={fetchRepos} disabled={isLoadingRepos || !token}>
                  {isLoadingRepos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Fetch Repos</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Requires <code className="bg-muted px-1 py-0.5 rounded">repo</code> scope. Your token is only used to fetch repositories and is not stored.
              </p>
            </div>
          </div>
          <div className={`space-y-4 transition-opacity duration-300 ${repos.length > 0 ? 'opacity-100' : 'opacity-50'}`}>
            <h3 className="font-semibold text-lg flex items-center"><span className="bg-primary text-primary-foreground rounded-full h-6 w-6 text-sm font-bold flex items-center justify-center mr-2">2</span> Select Repository</h3>
            <div className="space-y-2 pl-8">
              <Label>Repository to monitor</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
                    disabled={repos.length === 0}
                  >
                    {selectedRepo ? selectedRepo : "Select a repository..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search repository..." />
                    <CommandList>
                      <CommandEmpty>No repository found.</CommandEmpty>
                      <CommandGroup>
                        {repos.map((repo) => (
                          <CommandItem
                            key={repo.id}
                            value={repo.full_name}
                            onSelect={(currentValue) => {
                              setSelectedRepo(currentValue === selectedRepo ? null : currentValue);
                              setPopoverOpen(false);
                            }}
                          >
                            <CheckCircle className={`mr-2 h-4 w-4 ${selectedRepo === repo.full_name ? "opacity-100" : "opacity-0"}`} />
                            {repo.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={!token || !selectedRepo || isSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1 active:scale-95"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
              Enable Notifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}