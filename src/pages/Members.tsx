import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Loader2,
  Calendar,
} from 'lucide-react';
import { communityService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import toast from 'react-hot-toast';
import { useCommunity } from '../context/CommunityContext';

const Members = () => {
  const { selectedCommunityId } = useCommunity();
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCommunityId) return;
      try {
        setLoading(true);
        const [membersRes, rolesRes] = await Promise.all([
          communityService.getMembers(selectedCommunityId),
          communityService.getRoles(selectedCommunityId),
        ]);
        setMembers(membersRes.data || []);
        setRoles(rolesRes.data || []);
      } catch (err) {
        console.error('Failed to fetch members or roles', err);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCommunityId]);

  const handleKickMember = async (userId: string) => {
    if (!confirm('Voulez-vous vraiment exclure ce membre ?')) return;
    try {
      if (!selectedCommunityId) return;
      await communityService.kickMember(selectedCommunityId, userId);
      setMembers(members.filter(m => m.userId !== userId));
      toast.success('Membre exclu');
    } catch (err) {
      toast.error('Erreur lors de l\'exclusion');
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      if (!selectedCommunityId) return;
      await communityService.updateMemberRole(selectedCommunityId, userId, roleId);
      const matchingRole = roles.find(r => r.id === roleId);
      setMembers(members.map(m => m.userId === userId ? { ...m, role: matchingRole } : m));
      toast.success('Rôle mis à jour');
    } catch (err) {
      toast.error('Erreur lors du changement de rôle');
    }
  };

  const filteredMembers = members.filter(m =>
    m.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.community?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Communauté</h2>
          <p className="text-xs text-muted-foreground font-medium">Gérez les membres.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-gray-100 bg-white font-bold text-[10px] uppercase tracking-wider hover:bg-gray-50 transition-all">
            Exporter
          </Button>
          <Button size="sm" className="h-9 px-4 rounded-xl gap-2 shadow-md shadow-primary/10 font-bold text-[10px] uppercase tracking-wider">
            Inviter
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white rounded-xl border border-gray-50">
          <CardHeader className="p-4 pb-1.5">
            <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Total Membres</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black tracking-tighter">{members.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-xl border border-gray-50">
          <CardHeader className="p-4 pb-1.5">
            <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Nouveaux (7j)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black tracking-tighter text-success">
              +{members.filter(m => new Date(m.joinedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-xl border border-gray-50">
          <CardHeader className="p-4 pb-1.5">
            <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Engagement</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-black tracking-tighter text-primary">Normal</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden border border-gray-50">
        <CardHeader className="p-5 pb-4 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Membres</CardTitle>
            <CardDescription className="text-[10px] font-medium uppercase tracking-tight opacity-50">Visualisation des accès.</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 h-9 w-48 sm:w-64 bg-white border-gray-100 shadow-sm rounded-lg font-medium text-[11px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-lg border-gray-100 font-bold gap-2 text-[10px] uppercase tracking-wider">
              <Filter size={14} /> Filtre
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Chargement...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Aucun membre.</div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-gray-50">
                  <TableHead className="px-5 h-10 text-[9px] font-black uppercase tracking-widest opacity-50">Utilisateur</TableHead>
                  <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest opacity-50">Rôle</TableHead>
                  <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest opacity-50">Date</TableHead>
                  <TableHead className="px-5 h-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((m) => (
                  <TableRow key={m.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-lg border border-gray-100 shadow-sm shrink-0">
                          <AvatarImage src={m.user?.profileImage} />
                          <AvatarFallback className="bg-primary/5 text-primary font-black text-[10px]">{m.user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold leading-tight group-hover:text-primary transition-colors truncate">{m.user?.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium truncate opacity-60">{m.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md bg-gray-50 text-foreground border-gray-100 font-bold uppercase text-[8px] px-1.5 py-0">
                        {m.role?.name || 'Membre'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground opacity-70">
                        <Calendar size={12} className="text-primary/40" />
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-5">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center outline-none cursor-pointer">
                          <MoreVertical size={14} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg border border-gray-100 shadow-xl p-1 min-w-[140px]">
                          {roles
                            .filter((r) => r.name !== 'Créateur')
                            .map((role) => (
                              <DropdownMenuItem
                                key={role.id}
                                className="text-[10px] font-bold cursor-pointer"
                                onClick={() => handleRoleChange(m.userId, role.id)}
                              >
                                {role.name}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuItem className="text-[10px] font-bold text-destructive hover:bg-destructive/5 cursor-pointer" onClick={() => handleKickMember(m.userId)}>Exclure</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
