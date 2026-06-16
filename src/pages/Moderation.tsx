import { useState, useEffect } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { 
  ShieldAlert, 
  MessageSquare, 
  Trash2, 
  MoreVertical, 
  Filter, 
  Loader2,
  Heart,
  Send,
  X,
  MessageCircle,
  MapPin,
  Check,
  ThumbsUp,
  Share2
} from 'lucide-react';
import { ModerationChat } from '@/components/ModerationChat';
import { postService, commentService, moderationService } from '../services/api';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuPortal, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoader } from '@/components/layout/PageLoader';
import { PageShell } from '@/components/layout/PageShell';
import { SearchField } from '@/components/layout/SearchField';
import { FilterBar } from '@/components/layout/FilterBar';
import { PageTabs, PageTabsList, PageTabsTrigger, PageTabsContent } from '@/components/layout/PageTabs';
import { cn } from '@/lib/utils';



// Sub-component for Polls
const PollDisplay = ({ poll }: { poll: any }) => {
  const totalVotes = poll.totalVotes || 0;
  const isEnded = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;
  const maxVotes = poll.options?.length > 0 ? Math.max(...poll.options.map((o: any) => o.voteCount)) : 0;

  const getTimeRemaining = () => {
    if (isEnded) return 'Résultats finaux';
    if (!poll.endsAt) return '';
    const now = new Date();
    const end = new Date(poll.endsAt);
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours > 24) return `${Math.floor(hours / 24)}j restants`;
    return `${hours}h restantes`;
  };

  return (
    <div className="mt-3 space-y-1.5">
      {poll.options?.map((option: any) => {
        const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
        const isWinner = isEnded && option.voteCount === maxVotes && totalVotes > 0;
        
        return (
          <div key={option.id} className="relative h-9 rounded-lg border border-primary/10 overflow-hidden bg-primary/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              className={cn(
                "absolute inset-y-0 left-0 transition-colors duration-500",
                option.viewerVoted ? "bg-primary/20" : "bg-primary/5"
              )}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 z-10">
              <span className={cn("text-[11px] font-bold", isWinner && "text-primary")}>
                {option.text}
                {option.viewerVoted && <Check size={12} className="inline ml-1.5 text-primary" />}
              </span>
              <span className="text-[10px] font-black text-muted-foreground">{percentage}%</span>
            </div>
          </div>
        );
      })}
      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight mt-1 pl-1">
        {totalVotes} votes • {getTimeRemaining()}
      </p>
    </div>
  );
};

const RichText = ({ content, entities }: { content: string, entities?: any }) => {
  if (!entities) return <>{content}</>;
  const elements = [];
  let lastIndex = 0;
  const allEntities = [
    ...(entities.mentions || []).map((m: any) => ({ ...m, type: 'mention' })),
    ...(entities.hashtags || []).map((h: any) => ({ ...h, type: 'hashtag' })),
    ...(entities.urls || []).map((u: any) => ({ ...u, type: 'url' })),
  ].sort((a, b) => a.start - b.start);

  allEntities.forEach((entity, idx) => {
    if (entity.start > lastIndex) {
      elements.push(content.substring(lastIndex, entity.start));
    }
    const entityText = content.substring(entity.start, entity.end);
    if (entity.type === 'mention') {
      elements.push(<span key={`m-${idx}`} className="text-primary font-black cursor-pointer hover:underline">{entityText}</span>);
    } else if (entity.type === 'hashtag') {
      elements.push(<span key={`h-${idx}`} className="text-primary font-bold cursor-pointer hover:underline">{entityText}</span>);
    } else {
      elements.push(<a key={`u-${idx}`} href={entity.url} target="_blank" rel="noreferrer" className="text-primary underline font-medium">{entityText}</a>);
    }
    lastIndex = entity.end;
  });
  if (lastIndex < content.length) {
    elements.push(content.substring(lastIndex));
  }
  return <>{elements}</>;
};

const CommentsSidebar = ({ post, onClose }: { post: any, onClose: () => void }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (post?.id) {
      fetchComments();
    }
  }, [post?.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await commentService.getByPost(post.id);
      setComments(res.data || []);
    } catch (err) {
      toast.error('Erreur chargement commentaires');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-[360px] bg-card shadow-2xl z-[100] border-l border-border flex flex-col"
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Commentaires</h3>
          <p className="text-[10px] text-muted-foreground font-medium">{post.author?.name || post.user?.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-muted">
          <X size={16} className="text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-primary h-6 w-6" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 rounded-full mt-0.5 border border-border">
                <AvatarImage src={comment.author?.avatar} />
                <AvatarFallback className="bg-muted text-[10px] font-bold">
                  {(comment.author?.name || "U")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted p-3 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-bold text-foreground">{comment.author?.name || 'Anonyme'}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal font-medium">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-30">
            <MessageCircle className="mx-auto mb-2" size={24} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Aucun commentaire</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-muted/30">
        <div className="relative">
          <textarea 
            placeholder="Écrire un commentaire..."
            className="w-full bg-card border border-border rounded-xl p-3 pr-10 text-[11px] font-medium outline-none resize-none min-h-[40px] shadow-sm focus:border-primary/30 transition-colors"
          />
          <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform">
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) {
    if (date.getDate() === now.getDate()) {
      return `Aujourd'hui à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `Hier à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const PostCard = ({ post, onDelete, onCommentClick }: { post: any, onDelete: (id: string) => void, onCommentClick: (post: any) => void }) => {

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group relative"
    >
      <Card className="border-none shadow-sm bg-card rounded-2xl overflow-hidden mb-4 transition-all hover:shadow-md border border-border">
        <CardContent className="p-0">
          <div className="p-4 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-full shadow-sm border border-border">
                <AvatarImage src={post.author?.avatar || post.user?.avatar} />
                <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                  {(post.author?.name || post.user?.name || "T")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">{post.author?.name || post.user?.name || 'Utilisateur'}</span>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>{formatRelativeTime(post.createdAt)}</span>
                  <span>•</span>
                  <span className="text-primary font-bold uppercase tracking-tight">#{post.community?.name || 'COMMUNAUTÉ'}</span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 hover:bg-muted rounded-full transition-colors outline-none">
                <MoreVertical size={18} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent className="bg-card rounded-xl shadow-xl border border-border p-1 min-w-[140px] z-50">
                  <DropdownMenuItem 
                    className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-destructive hover:bg-destructive/5 rounded-lg cursor-pointer outline-none"
                    onClick={() => onDelete(post.id)}
                  >
                    <Trash2 size={14} /> Supprimer
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-muted-foreground hover:bg-muted rounded-lg cursor-pointer outline-none">
                    <ShieldAlert size={14} /> Modérer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>

          <div className="px-4 pb-3">
            <div className="text-sm font-medium text-foreground mb-3 leading-snug">
              <RichText content={post.content} entities={post.entities} />
            </div>

            {post.location && (
              <div className="flex items-center gap-1 text-[9px] text-primary font-black uppercase tracking-widest mb-3">
                <MapPin size={12} /> {post.location.name}
              </div>
            )}

            {(post.image || (post.images && post.images.length > 0)) && (
              <div className="rounded-xl overflow-hidden mb-3 border border-border shadow-inner bg-muted">
                <img 
                  src={post.image || post.images?.[0]} 
                  className="w-full h-auto object-cover max-h-[360px]" 
                  alt="Post content" 
                />
              </div>
            )}

            {post.poll && <PollDisplay poll={post.poll} />}
          </div>

          <div className="px-4 py-2 flex items-center justify-between border-t border-[#f8f8f8]">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center border border-white">
                  <ThumbsUp size={8} className="text-white fill-current" />
                </div>
                <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center border border-white">
                  <Heart size={8} className="text-white fill-current" />
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-bold">
                {(post.stats?.likeCount || 0) + (post.stats?.heartCount || 0) + (post.stats?.flameCount || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
              <span>{post.stats?.replyCount || 0} Commentaires</span>
              <span className="opacity-30">•</span>
              <span>{post.stats?.repostCount || 0} Partages</span>
            </div>
          </div>

          <div className="px-3 py-1.5 flex items-center justify-around bg-muted/30">
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg text-muted-foreground font-bold text-xs cursor-default opacity-40">
              <ThumbsUp size={16} />
              <span>J'aime</span>
            </div>
            <button 
              onClick={() => onCommentClick(post)}
              className="flex items-center gap-2 py-2 px-3 rounded-lg text-muted-foreground hover:bg-muted transition-all font-bold text-xs"
            >
              <MessageCircle size={16} />
              <span>Commenter</span>
            </button>
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg text-muted-foreground font-bold text-xs cursor-default opacity-40">
              <Share2 size={16} />
              <span>Partager</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Moderation = () => {
  const { selectedCommunityId } = useCommunity();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reportsFilter, setReportsFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');

  useEffect(() => { 
    if (selectedCommunityId) {
      fetchData(); 
    }
  }, [selectedCommunityId]);

  const fetchData = async () => {
    if (!selectedCommunityId) return;
    try {
      setLoading(true);
      const [postsRes, reportsRes] = await Promise.all([
        postService.getAll(selectedCommunityId),
        moderationService.getCommunityReports(selectedCommunityId),
      ]);
      setPosts(postsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (err) { 
      toast.error('Erreur chargement'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce post ?')) return;
    try {
      await postService.delete(id);
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post supprimé');
    } catch (err) { 
      toast.error('Erreur suppression'); 
    }
  };

  const handleProcessReport = async (reportId: string, action: 'dismissed' | 'deleted' | 'kicked' | 'muted') => {
    if (!selectedCommunityId) return;
    const confirmMessage = {
      dismissed: 'Ignorer ce signalement ?',
      deleted: 'Supprimer ce contenu ?',
      kicked: 'Exclure cet utilisateur de la communauté ?',
      muted: 'Rendre cet utilisateur muet dans la communauté ?'
    }[action];
    
    if (!confirm(confirmMessage)) return;

    try {
      await moderationService.updateCommunityReport(selectedCommunityId, reportId, {
        actionTaken: action,
        note: `Traité par le CM via l'interface d'administration.`
      });
      toast.success('Signalement traité avec succès');
      
      // Mettre à jour l'état local
      setReports(reports.map(r => r.id === reportId ? { ...r, status: action === 'dismissed' ? 'dismissed' : 'resolved', actionTaken: action } : r));
      
      // Si l'action est supprimé et qu'il s'agit d'un post, on le retire aussi de l'état des posts si présent
      if (action === 'deleted') {
        const rep = reports.find(r => r.id === reportId);
        if (rep && rep.type === 'post' && rep.targetPost) {
          setPosts(posts.filter(p => p.id !== rep.targetPost.id));
        }
      }
    } catch (err) {
      toast.error('Erreur lors du traitement du signalement');
    }
  };

  const [selectedPostForComments, setSelectedPostForComments] = useState<any | null>(null);

  const filteredReports = reports.filter(r => {
    if (reportsFilter === 'all') return true;
    if (reportsFilter === 'pending') return r.status === 'pending';
    if (reportsFilter === 'resolved') return r.status === 'resolved';
    if (reportsFilter === 'dismissed') return r.status === 'dismissed';
    return true;
  });

  const REPORT_FILTER_OPTIONS = [
    { value: 'pending', label: 'En attente' },
    { value: 'resolved', label: 'Résolus' },
    { value: 'dismissed', label: 'Ignorés' },
    { value: 'all', label: 'Tous' },
  ];

  if (loading) return <PageLoader />;

  return (
    <PageShell className="relative overflow-x-hidden">
      <PageHeader
        title="Modération & Social"
        description="Contrôle et animation du contenu communautaire"
        actions={
          <>
            <SearchField placeholder="Rechercher…" containerClassName="sm:w-48" />
            <Button variant="outline" size="sm">
              <Filter data-icon="inline-start" />
              Filtre
            </Button>
          </>
        }
      />

      <PageTabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <PageTabsList>
          <PageTabsTrigger value="posts">Posts</PageTabsTrigger>
          <PageTabsTrigger value="rooms">Chats</PageTabsTrigger>
          <PageTabsTrigger value="reports" tone="destructive">Signalements</PageTabsTrigger>
        </PageTabsList>

        <PageTabsContent value="posts">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <AnimatePresence mode="popLayout">
                {posts.length > 0 ? posts.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={handleDeletePost} onCommentClick={(p) => setSelectedPostForComments(p)} />
                )) : (
                  <div className="py-20 text-center bg-card rounded-3xl shadow-sm border border-dashed border-border">
                    <MessageSquare size={40} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Aucun post à modérer</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-4 space-y-4 hidden lg:block">
              <Card className="border-none shadow-sm bg-card rounded-3xl p-6 sticky top-28 border border-border">
                <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Vue d'ensemble</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Statistiques de la semaine</p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted/50 p-4 rounded-2xl border border-border shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Flux Social</p>
                      <p className="text-2xl font-black text-foreground">{posts.length}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-2xl border border-border shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Croissance</p>
                      <p className="text-2xl font-black text-primary">+12.5%</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full h-11 rounded-xl font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:bg-muted border-border shadow-sm">
                    Télécharger le rapport
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </PageTabsContent>

        <PageTabsContent value="rooms">
          {selectedCommunityId ? (
            <ModerationChat communityId={selectedCommunityId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] border border-dashed rounded-3xl opacity-40 bg-muted/50">
              <MessageSquare size={48} className="mb-4 text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sélectionnez une communauté</p>
            </div>
          )}
        </PageTabsContent>

        <PageTabsContent value="reports">
          <div className="space-y-6">
            <FilterBar
              options={REPORT_FILTER_OPTIONS}
              value={reportsFilter}
              onChange={(v) => setReportsFilter(v as typeof reportsFilter)}
              trailing={
                <span className="mr-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {filteredReports.length} Signalements
                </span>
              }
            />

            {filteredReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="border-none shadow-sm bg-card rounded-3xl p-5 border border-border flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* En-tête du signalement */}
                      <div className="flex justify-between items-start">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary uppercase tracking-tight">
                            {report.type}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-500 uppercase tracking-tight">
                            {report.reason}
                          </span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight",
                          report.status === 'pending' ? "bg-amber-50 text-amber-500" :
                          report.status === 'resolved' ? "bg-green-50 text-green-500" : "bg-muted text-muted-foreground"
                        )}>
                          {report.status === 'pending' && 'En attente'}
                          {report.status === 'resolved' && 'Résolu'}
                          {report.status === 'dismissed' && 'Ignoré'}
                        </span>
                      </div>

                      {/* Info reporter et date */}
                      <div className="text-[10px] text-muted-foreground font-medium">
                        Signalé par <span className="font-bold text-muted-foreground">{report.reporter?.name || 'Utilisateur'}</span> • {formatRelativeTime(report.createdAt)}
                      </div>

                      {/* Détails du signalement */}
                      {report.details && (
                        <p className="text-[11px] text-muted-foreground font-medium bg-muted/50 p-2.5 rounded-xl border border-border">
                          "{report.details}"
                        </p>
                      )}

                      {/* Aperçu du contenu ciblé */}
                      <div className="bg-muted p-3 rounded-2xl border border-border/50 space-y-2">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Contenu ciblé</p>
                        
                        {report.type === 'post' && report.targetPost && (
                          <div className="text-xs font-semibold text-foreground leading-snug">
                            {report.targetPost.content}
                          </div>
                        )}
                        {report.type === 'comment' && report.targetComment && (
                          <div className="text-xs font-semibold text-foreground leading-snug">
                            {report.targetComment.content}
                          </div>
                        )}
                        {report.type === 'chat' && report.targetChat && (
                          <div className="text-xs font-semibold text-foreground leading-snug">
                            {report.targetChat.content}
                          </div>
                        )}
                        {report.type === 'user' && report.targetUser && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 rounded-full">
                              <AvatarImage src={report.targetUser.avatar} />
                              <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                {report.targetUser.name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-bold text-foreground">{report.targetUser.name}</p>
                              <p className="text-[9px] text-muted-foreground">@{report.targetUser.username}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes de modération */}
                      {report.status !== 'pending' && (
                        <div className="text-[10px] text-muted-foreground bg-green-50/10 p-2 rounded-xl border border-green-100/30">
                          <span className="font-bold">Action prise :</span> {report.actionTaken}
                          {report.note && <p className="mt-1 italic">"{report.note}"</p>}
                        </div>
                      )}
                    </div>

                    {/* Actions de modération local */}
                    {report.status === 'pending' && (
                      <div className="flex flex-wrap gap-1.5 mt-5 border-t border-border pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProcessReport(report.id, 'dismissed')}
                          className="h-8 text-[9px] font-bold uppercase tracking-tight bg-muted hover:bg-muted text-muted-foreground rounded-lg flex-1"
                        >
                          Ignorer
                        </Button>
                        
                        {(report.type === 'post' || report.type === 'comment' || report.type === 'chat') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleProcessReport(report.id, 'deleted')}
                            className="h-8 text-[9px] font-bold uppercase tracking-tight rounded-lg flex-1"
                          >
                            Supprimer
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessReport(report.id, 'muted')}
                          className="h-8 text-[9px] font-bold uppercase tracking-tight border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 rounded-lg flex-1"
                        >
                          Mute
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessReport(report.id, 'kicked')}
                          className="h-8 text-[9px] font-bold uppercase tracking-tight border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg flex-1"
                        >
                          Exclure
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-none shadow-sm bg-card rounded-3xl py-20 text-center space-y-6 border border-border">
                <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center mx-auto shadow-inner border border-green-100/50">
                  <ShieldAlert size={36} className="text-green-500" />
                </div>
                <div className="max-w-xs mx-auto px-4">
                  <h4 className="text-sm font-black text-foreground tracking-tight">Aucun signalement</h4>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed mt-2 uppercase tracking-wide">
                    {reportsFilter === 'pending' ? 'Aucun signalement en attente de traitement.' : 'Aucun signalement trouvé pour ce filtre.'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </PageTabsContent>
      </PageTabs>

      <AnimatePresence>
        {selectedPostForComments && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedPostForComments(null)} 
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90]" 
            />
            <CommentsSidebar post={selectedPostForComments} onClose={() => setSelectedPostForComments(null)} />
          </>
        )}
      </AnimatePresence>
    </PageShell>
  );
};

export default Moderation;
