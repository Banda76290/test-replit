import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAdminProfile, useUpdatePreferences } from "@workspace/api-client-react";
import { User, Shield, Bell, Settings as SettingsIcon, Monitor, Save, Loader2 } from "lucide-react";

export default function AdminPage() {
  const { data: profile, isLoading } = useGetAdminProfile();
  const updatePrefs = useUpdatePreferences();
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save delay
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
  };

  if (isLoading || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin & Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your OASIS account settings and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-border/60 shadow-sm bg-white overflow-hidden text-center">
              <div className="h-24 bg-gradient-to-r from-primary/80 to-primary"></div>
              <CardContent className="px-6 pb-6 pt-0 relative">
                <div className="w-20 h-20 rounded-full border-4 border-white bg-white mx-auto -mt-10 mb-4 shadow-sm flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                    {profile.user.name.charAt(0)}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-foreground">{profile.user.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.user.email}</p>
                
                <div className="mt-6 flex flex-col gap-2">
                  <div className="flex justify-between items-center px-3 py-2 bg-muted/30 rounded-md text-sm border border-border/50">
                    <span className="text-muted-foreground flex items-center"><User className="w-4 h-4 mr-2" /> Role</span>
                    <span className="font-medium text-foreground">{profile.user.role}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 bg-muted/30 rounded-md text-sm border border-border/50">
                    <span className="text-muted-foreground flex items-center"><Shield className="w-4 h-4 mr-2" /> Team</span>
                    <span className="font-medium text-foreground">{profile.user.team}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Cards */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/60 shadow-sm bg-white">
              <CardHeader className="border-b border-border/50 bg-muted/10">
                <CardTitle className="text-lg flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2 text-primary" />
                  Workspace Preferences
                </CardTitle>
                <CardDescription>Customize how OASIS responds and behaves</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">Response Detail Level</label>
                    <select className="w-full bg-white border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option>Concise</option>
                      <option>Standard</option>
                      <option>Comprehensive</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">Default Output Language</label>
                    <select className="w-full bg-white border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option>English</option>
                      <option>French</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Email Notifications</h4>
                    <p className="text-xs text-muted-foreground">Receive alerts when long analyses complete</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="shadow-sm">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm bg-white">
              <CardHeader className="border-b border-border/50 bg-muted/10">
                <CardTitle className="text-lg flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-slate-500" />
                  Recent Logins
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {profile.recentLogins.map((login, i) => (
                    <div key={i} className="flex justify-between items-center p-4 text-sm hover:bg-muted/10 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">{login.device}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">IP: {login.ip}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(login.date).toLocaleDateString()} {new Date(login.date).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
