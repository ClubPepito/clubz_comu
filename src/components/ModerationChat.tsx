import React, { useState, useEffect } from 'react';
import {
  Hash,
  Megaphone,
  Plus,
  Settings,
  Trash2,
  Edit2,
  MessageSquare,
  Send,
  MoreVertical,
  User,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChatSocket } from '@/hooks/useChatSocket';
import { channelService, chatService } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'announcement';
  roomId: string;
}

interface Category {
  id: string;
  name: string;
  channels: Channel[];
}

interface ModerationChatProps {
  communityId: string;
}

export const ModerationChat: React.FC<ModerationChatProps> = ({ communityId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'announcement'>('text');

  const [renameTarget, setRenameTarget] = useState<{ type: 'category' | 'channel', id: string, name: string } | null>(null);

  const { messages, setMessages, sendMessage, isConnected } = useChatSocket(selectedChannel?.roomId || null);

  useEffect(() => {
    if (communityId) {
      loadData();
    }
  }, [communityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await channelService.getAll(communityId);
      setCategories(res.data);

      // Auto-select first channel if none selected
      if (res.data.length > 0 && res.data[0].channels.length > 0 && !selectedChannel) {
        setSelectedChannel(res.data[0].channels[0]);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChannel) {
      loadHistory();
    }
  }, [selectedChannel]);

  const loadHistory = async () => {
    if (!selectedChannel) return;
    try {
      const res = await chatService.getByRoom(selectedChannel.roomId);
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel) return;
    sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.delete(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message supprimé');
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  // Management functions
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await channelService.createCategory(communityId, newCategoryName);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      loadData();
      toast.success('Catégorie créée');
    } catch (error) {
      toast.error('Erreur création catégorie');
    }
  };

  const handleCreateChannel = async () => {
    console.log('Attempting to create channel:', { communityId, selectedCategoryId, newChannelName, newChannelType });
    if (!newChannelName.trim()) {
      toast.error('Nom du salon requis');
      return;
    }
    if (!selectedCategoryId) {
      toast.error('Catégorie non sélectionnée');
      return;
    }

    try {
      setIsCreatingChannel(true);
      await channelService.createChannel(communityId, selectedCategoryId, newChannelName, newChannelType);
      setNewChannelName('');
      setIsChannelModalOpen(false);
      await loadData();
      toast.success('Salon créé');
    } catch (error) {
      console.error('Create channel error:', error);
      toast.error('Erreur création salon');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameTarget.name.trim()) return;
    try {
      if (renameTarget.type === 'category') {
        await channelService.renameCategory(communityId, renameTarget.id, renameTarget.name);
      } else {
        await channelService.renameChannel(communityId, renameTarget.id, renameTarget.name);
      }
      setIsRenameModalOpen(false);
      setRenameTarget(null);
      loadData();
      toast.success('Renommé avec succès');
    } catch (error) {
      toast.error('Erreur renommage');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie et tous ses salons ?')) return;
    try {
      await channelService.deleteCategory(communityId, id);
      loadData();
      toast.success('Catégorie supprimée');
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce salon ?')) return;
    try {
      await channelService.deleteChannel(communityId, id);
      if (selectedChannel?.id === id) setSelectedChannel(null);
      loadData();
      toast.success('Salon supprimé');
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[700px] border rounded-3xl overflow-hidden bg-background shadow-xl">
      {/* Sidebar - Discord Style */}
      <div className="w-64 flex flex-col bg-muted/20 border-r">
        <div className="p-4 border-b bg-background/40 backdrop-blur-md flex items-center justify-between">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
            <MessageSquare size={14} className="text-primary" />
            Social Hub
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary" onClick={() => setIsCategoryModalOpen(true)}>
            <Plus size={14} />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="space-y-1">
                <div className="px-2 mb-1 flex items-center justify-between group cursor-pointer" onClick={() => {
                  setSelectedCategoryId(category.id);
                  setSelectedCategoryName(category.name);
                  setIsChannelModalOpen(true);
                }}>
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest hover:text-primary transition-colors">
                    {category.name}
                  </span>
                  <div className="flex items-center gap-1 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                        <div className="p-0.5 hover:bg-muted rounded text-muted-foreground transition-colors cursor-pointer">
                          <MoreVertical size={10} />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-32 rounded-xl">
                        <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-tight gap-2" onClick={() => {
                          setRenameTarget({ type: 'category', id: category.id, name: category.name });
                          setIsRenameModalOpen(true);
                        }}>
                          <Edit2 size={12} /> Renommer
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-tight gap-2 text-destructive focus:text-destructive" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 size={12} /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div 
                      className="p-1 w-5 h-5 flex items-center justify-center bg-primary/10 text-primary rounded-md transition-all hover:bg-primary hover:text-white cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryId(category.id);
                        setSelectedCategoryName(category.name);
                        setIsChannelModalOpen(true);
                      }}
                      title="Ajouter un salon"
                    >
                      <Plus size={12} className="stroke-[3]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {category.channels.map((channel) => (
                    <div key={channel.id} className="group relative flex items-center">
                      <button
                        onClick={() => setSelectedChannel(channel)}
                        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${selectedChannel?.id === channel.id
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {channel.type === 'announcement' ? (
                          <Megaphone size={14} className={selectedChannel?.id === channel.id ? 'text-primary-foreground' : 'text-muted-foreground/60'} />
                        ) : (
                          <Hash size={14} className={selectedChannel?.id === channel.id ? 'text-primary-foreground' : 'text-muted-foreground/60'} />
                        )}
                        <span className={`text-xs ${selectedChannel?.id === channel.id ? 'font-black uppercase tracking-wide' : 'font-semibold'}`}>
                          {channel.name}
                        </span>
                      </button>

                      <div className={`absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${selectedChannel?.id === channel.id ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <div className="p-1 hover:bg-black/5 rounded-md cursor-pointer transition-colors">
                              <Settings size={10} />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32 rounded-xl">
                            <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-tight gap-2" onClick={() => {
                              setRenameTarget({ type: 'channel', id: channel.id, name: channel.name });
                              setIsRenameModalOpen(true);
                            }}>
                              <Edit2 size={12} /> Renommer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-tight gap-2 text-destructive focus:text-destructive" onClick={() => handleDeleteChannel(channel.id)}>
                              <Trash2 size={12} /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {!isConnected && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-primary/5 border-b border-primary/10 px-4 py-1.5 text-[9px] text-center text-primary font-black uppercase tracking-[0.2em] animate-pulse">
            Connecting to Real-time Stream...
          </div>
        )}

        {/* Chat Header */}
        <div className="h-16 border-b flex items-center justify-between px-8 bg-background/40 backdrop-blur-xl z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              {selectedChannel?.type === 'announcement' ? <Megaphone size={20} /> : <Hash size={20} />}
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider text-foreground leading-none">
                {selectedChannel?.name || 'Social Hub'}
              </h4>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                {selectedChannel?.type === 'announcement' ? 'Announcements Flow' : 'General Discussion'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <ScrollArea className="flex-1 px-8 py-6">
          <div className="space-y-8 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <MessageSquare size={32} className="text-muted-foreground/30" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Le silence est d'or</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const showAvatar = index === 0 || messages[index - 1].sender?.id !== message.sender?.id;

                return (
                  <div key={message.id} className={`flex gap-4 group ${!showAvatar ? 'mt-[-24px]' : ''}`}>
                    <div className="w-12 flex-shrink-0 flex justify-center">
                      {showAvatar ? (
                        <Avatar className="h-12 w-12 rounded-2xl border-2 border-background shadow-lg group-hover:scale-105 transition-transform">
                          <AvatarImage src={message.sender?.avatar} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-black uppercase tracking-tighter">
                            {message.sender?.name?.[0] || <User size={16} />}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-12 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                          <span className="text-[8px] font-black text-muted-foreground/40">{format(new Date(message.createdAt), 'HH:mm')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="font-black text-xs uppercase tracking-tight text-foreground hover:text-primary transition-colors cursor-pointer">
                            {message.sender?.name || 'Ghost User'}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest bg-muted/30 px-2 py-0.5 rounded-full">
                            {format(new Date(message.createdAt), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                      )}

                      <div className="relative group/content">
                        <div className="text-[13px] font-medium text-foreground/80 leading-relaxed break-words pr-12">
                          {message.content}
                        </div>

                        <div className="absolute right-0 top-0 opacity-0 group-hover/content:opacity-100 transition-opacity flex gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <div className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                <MoreVertical size={12} />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 rounded-xl">
                              <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-tight gap-2 text-destructive focus:text-destructive" onClick={() => handleDeleteMessage(message.id)}>
                                <Trash2 size={12} /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-6 bg-background/40 backdrop-blur-md border-t">
          <form onSubmit={handleSendMessage} className="relative group">
            <Input
              placeholder={`Message dans #${selectedChannel?.name || 'salon'}`}
              className="pr-14 h-12 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl font-medium text-[13px] transition-all placeholder:text-muted-foreground/40"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              disabled={!newMessage.trim() || !isConnected}
            >
              <Send size={16} />
            </Button>
          </form>
          <div className="flex items-center gap-4 mt-3 px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
              Press Enter to send
            </p>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
              Markdown supported
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg uppercase tracking-tight">Nouvelle Catégorie</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Input
              placeholder="Nom de la catégorie (ex: SOCIAL, STAFF...)"
              className="h-12 rounded-2xl bg-muted/50 border-none font-bold uppercase tracking-wider"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px]" onClick={() => setIsCategoryModalOpen(false)}>Annuler</Button>
            <Button className="rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 px-8" onClick={handleCreateCategory}>Créer la catégorie</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChannelModalOpen} onOpenChange={setIsChannelModalOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg uppercase tracking-tight">Nouveau Salon</DialogTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
              Dans la catégorie <span className="text-primary">{selectedCategoryName}</span>
            </p>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Input
              placeholder="Nom du salon (ex: general, annonces...)"
              className="h-12 rounded-2xl bg-muted/50 border-none font-bold lowercase"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              disabled={isCreatingChannel}
            />
            <Select value={newChannelType} onValueChange={(v: any) => setNewChannelType(v)} disabled={isCreatingChannel}>
              <SelectTrigger size="lg">
                <SelectValue placeholder="Type de salon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <Hash size={14} /> Salon Textuel
                  </div>
                </SelectItem>
                <SelectItem value="announcement">
                  <div className="flex items-center gap-2">
                    <Megaphone size={14} /> Salon d'Annonces
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px]" onClick={() => {
              setIsChannelModalOpen(false);
              setSelectedCategoryId(null);
              setSelectedCategoryName(null);
            }} disabled={isCreatingChannel}>Annuler</Button>
            <Button
              className="rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 px-8 gap-2"
              onClick={handleCreateChannel}
              disabled={isCreatingChannel || !newChannelName.trim() || !selectedCategoryId}
            >
              {isCreatingChannel && <Loader2 size={14} className="animate-spin" />}
              {isCreatingChannel ? 'Création...' : 'Créer le salon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg uppercase tracking-tight">Renommer</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Input
              placeholder="Nouveau nom..."
              className="h-12 rounded-2xl bg-muted/50 border-none font-bold"
              value={renameTarget?.name || ''}
              onChange={(e) => setRenameTarget(prev => prev ? { ...prev, name: e.target.value } : null)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px]" onClick={() => setIsRenameModalOpen(false)}>Annuler</Button>
            <Button className="rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 px-8" onClick={handleRename}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
