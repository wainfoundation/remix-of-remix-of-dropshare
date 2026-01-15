import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Image as ImageIcon, Video, Target, Wallet } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePiPayment } from '@/hooks/use-pi-payment';

const AD_TYPES = [
  { id: 'feed', label: 'Feed Ad', description: 'Appears in user feeds', icon: ImageIcon },
  { id: 'story', label: 'Story Ad', description: 'Full-screen between stories', icon: Video },
  { id: 'reel', label: 'Reel Ad', description: 'Short video in reels', icon: Video },
  { id: 'explore', label: 'Explore Ad', description: 'Featured on explore page', icon: Target },
];

const BID_TYPES = [
  { id: 'cpm', label: 'CPM', description: 'Pay per 1,000 impressions' },
  { id: 'cpc', label: 'CPC', description: 'Pay per click' },
  { id: 'cpa', label: 'CPA', description: 'Pay per conversion' },
];

const CreateAd = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isProcessing, createPayment } = usePiPayment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Ad Creative
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adType, setAdType] = useState('feed');

  // Step 2: Destination
  const [destinationType, setDestinationType] = useState('external');
  const [destinationUrl, setDestinationUrl] = useState('');

  // Step 3: Budget
  const [bidType, setBidType] = useState('cpm');
  const [bidAmount, setBidAmount] = useState([0.0001]);
  const [budgetPi, setBudgetPi] = useState([1]);
  const [duration, setDuration] = useState('7');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to create ads',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an ad title',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `ads/${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(duration));

      // Create ad
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          image_url: imageUrl,
          ad_type: adType,
          destination_type: destinationType,
          destination_url: destinationUrl || null,
          bid_type: bidType,
          bid_amount_pi: bidAmount[0],
          budget_pi: budgetPi[0],
          status: 'draft',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single();

      if (adError) throw adError;

      // Process payment to fund the ad
      try {
        await createPayment(
          budgetPi[0],
          `Fund DropShare Ad: ${title}`,
          { adId: adData.id, type: 'ad_budget' }
        );

        // Update ad status to active after payment
        await supabase
          .from('ads')
          .update({ status: 'active' })
          .eq('id', adData.id);

        toast({
          title: 'Ad Created!',
          description: 'Your ad is now live and running.',
        });
      } catch (paymentError) {
        // Ad created but payment failed - keep as draft
        toast({
          title: 'Ad Saved as Draft',
          description: 'Ad created but payment pending. Fund it to go live.',
        });
      }

      navigate('/ads');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Sign in to create ads</h2>
          <Button onClick={() => navigate('/login')} className="mt-6">
            Log In
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} className="p-2">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">Create Ad</h1>
          </div>
          <span className="text-sm text-muted-foreground">Step {step} of 3</span>
        </header>

        <div className="p-4 space-y-6">
          {/* Progress */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Creative */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ad Creative</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Ad Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter your ad title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">{title.length}/50</p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your ad..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={200}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">{description.length}/200</p>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Ad Image</Label>
                    {imagePreview ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={imagePreview}
                          alt="Ad preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload Image</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ad Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ad Placement</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={adType} onValueChange={setAdType} className="space-y-3">
                    {AD_TYPES.map((type) => (
                      <label
                        key={type.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          adType === type.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <RadioGroupItem value={type.id} id={type.id} />
                        <type.icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Button onClick={() => setStep(2)} className="w-full" disabled={!title.trim()}>
                Next: Destination
              </Button>
            </div>
          )}

          {/* Step 2: Destination */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Where should this ad lead?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Destination Type</Label>
                    <Select value={destinationType} onValueChange={setDestinationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">External Website</SelectItem>
                        <SelectItem value="profile">My Profile</SelectItem>
                        <SelectItem value="post">Specific Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {destinationType === 'external' && (
                    <div className="space-y-2">
                      <Label htmlFor="url">Website URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={destinationUrl}
                        onChange={(e) => setDestinationUrl(e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Next: Budget
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Budget & Bidding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bid Type */}
                  <div className="space-y-3">
                    <Label>Bid Strategy</Label>
                    <RadioGroup value={bidType} onValueChange={setBidType} className="space-y-2">
                      {BID_TYPES.map((type) => (
                        <label
                          key={type.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            bidType === type.id ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <RadioGroupItem value={type.id} id={type.id} />
                          <div>
                            <p className="font-medium text-sm">{type.label}</p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Bid Amount */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Bid Amount</Label>
                      <span className="text-sm font-medium">{bidAmount[0].toFixed(4)} π</span>
                    </div>
                    <Slider
                      value={bidAmount}
                      onValueChange={setBidAmount}
                      min={0.0001}
                      max={0.01}
                      step={0.0001}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher bids get more visibility
                    </p>
                  </div>

                  {/* Total Budget */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Total Budget</Label>
                      <span className="text-sm font-medium">{budgetPi[0]} π</span>
                    </div>
                    <Slider
                      value={budgetPi}
                      onValueChange={setBudgetPi}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label>Campaign Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ad Type</span>
                    <span>{AD_TYPES.find((t) => t.id === adType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bid Strategy</span>
                    <span>{BID_TYPES.find((t) => t.id === bidType)?.label}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>{budgetPi[0]} π</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={isLoading || isProcessing}
                >
                  {isLoading || isProcessing ? 'Creating...' : `Pay ${budgetPi[0]} π & Launch`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateAd;
