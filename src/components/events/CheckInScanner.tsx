import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, Keyboard, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { eventService } from '@/services/api'
import { toast } from 'sonner'

interface CheckInScannerProps {
  eventId: string
  open: boolean
  onClose: () => void
  onSuccess?: (attendeeId: string) => void
}

type ScanMode = 'camera' | 'manual'
type ScanResult = 'success' | 'error' | null

const SCANNER_ID = 'check-in-qr-scanner'

export function CheckInScanner({ eventId, open, onClose, onSuccess }: CheckInScannerProps) {
  const [mode, setMode] = useState<ScanMode>('camera')
  const [manualToken, setManualToken] = useState('')
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ScanResult>(null)
  const [resultMessage, setResultMessage] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {
        // ignore if not running
      }
      scannerRef.current = null
    }
    setScanning(false)
  }

  const startScanner = async () => {
    if (scannerRef.current) return

    try {
      const scanner = new Html5Qrcode(SCANNER_ID)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleCheckIn(decodedText)
        },
        undefined
      )
      setScanning(true)
    } catch (err) {
      console.error('Failed to start scanner', err)
      toast.error('Impossible d\'accéder à la caméra. Utilisez la saisie manuelle.')
      setMode('manual')
    }
  }

  const handleCheckIn = async (token: string) => {
    if (processing) return
    await stopScanner()
    setProcessing(true)

    try {
      await eventService.checkIn(eventId, token)
      setResult('success')
      setResultMessage('Check-in effectué avec succès !')
      onSuccess?.(token)
      toast.success('Check-in réussi !')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) {
        setResult('error')
        setResultMessage('Accès refusé — droits insuffisants pour effectuer un check-in.')
      } else if (status === 404) {
        setResult('error')
        setResultMessage('Billet introuvable ou QR code invalide.')
      } else if (status === 409) {
        setResult('error')
        setResultMessage('Ce participant est déjà enregistré.')
      } else {
        setResult('error')
        setResultMessage('Erreur lors du check-in. Veuillez réessayer.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleManualSubmit = () => {
    if (!manualToken.trim()) return
    handleCheckIn(manualToken.trim())
  }

  const handleReset = () => {
    setResult(null)
    setResultMessage('')
    setManualToken('')
    if (mode === 'camera') startScanner()
  }

  const handleClose = () => {
    stopScanner()
    setResult(null)
    setResultMessage('')
    setManualToken('')
    onClose()
  }

  useEffect(() => {
    if (open && mode === 'camera') {
      const timer = setTimeout(() => startScanner(), 300)
      return () => clearTimeout(timer)
    } else {
      stopScanner()
    }
    return () => { stopScanner() }
  }, [open, mode])

  useEffect(() => {
    if (!open) stopScanner()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode size={18} className="text-primary" />
            Scanner QR — Check-in
          </DialogTitle>
        </DialogHeader>

        {/* Mode selector */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
              mode === 'camera'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => { setMode('camera'); setResult(null) }}
          >
            <QrCode size={14} />
            Caméra
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => { setMode('manual'); stopScanner(); setResult(null) }}
          >
            <Keyboard size={14} />
            Manuel
          </button>
        </div>

        {/* Result state */}
        {result && (
          <div
            className={`flex flex-col items-center gap-3 rounded-xl p-6 text-center ${
              result === 'success'
                ? 'bg-success/10 border border-success/20'
                : 'bg-destructive/10 border border-destructive/20'
            }`}
          >
            {result === 'success' ? (
              <CheckCircle2 size={40} className="text-success" />
            ) : (
              <AlertCircle size={40} className="text-destructive" />
            )}
            <p className="text-sm font-medium">{resultMessage}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleReset}>
                Scanner à nouveau
              </Button>
              <Button size="sm" onClick={handleClose}>
                <X size={14} data-icon="inline-start" />
                Fermer
              </Button>
            </div>
          </div>
        )}

        {/* Camera scanner */}
        {!result && mode === 'camera' && (
          <div className="flex flex-col items-center gap-3">
            <div
              id={SCANNER_ID}
              className="w-full rounded-xl overflow-hidden bg-muted min-h-[280px] flex items-center justify-center"
            >
              {!scanning && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs">Démarrage de la caméra…</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Pointez la caméra vers le QR code du billet
            </p>
          </div>
        )}

        {/* Manual input */}
        {!result && mode === 'manual' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="manual-token">Token du billet</Label>
              <Input
                id="manual-token"
                placeholder="Ex: KLYB-XXXX-XXXX-XXXX"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Saisissez le token inscrit sur le billet du participant.
              </p>
            </div>
            <Button
              onClick={handleManualSubmit}
              disabled={!manualToken.trim() || processing}
              className="w-full"
            >
              {processing ? (
                <Loader2 size={14} className="animate-spin" data-icon="inline-start" />
              ) : (
                <CheckCircle2 size={14} data-icon="inline-start" />
              )}
              {processing ? 'Vérification…' : 'Valider le check-in'}
            </Button>
          </div>
        )}

        {processing && !result && (
          <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin" />
            Vérification en cours…
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
