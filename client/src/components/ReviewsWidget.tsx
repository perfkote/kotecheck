import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Review {
  stars: string;
  text: string;
  name: string;
}

const reviews: Review[] = [
  {stars:"⭐⭐⭐⭐⭐", text:"expert pipe polishers.", name:"— Todd P., Orlando"},
  {stars:"⭐⭐⭐☆☆", text:"my husband left me because my engine wasn't hot enough.", name:"— Lisa from Accounts Payable"},
  {stars:"⭐⭐⭐⭐⭐", text:"I get alot of attention from other guys , so that's something .", name:"— Kyle L."},
  {stars:"⭐⭐☆☆☆", text:"The owner referred to me as Harry Potter , and told me to go suck on a goblet of fire…still don't know what that means", name:"— Harry P."},
  {stars:"⭐⭐⭐⭐⭐", text:"Dropped off my headers. Got it back so shiny , it was being mined in Africa", name:"— Steve '2-Bar' Johnson"},
  {stars:"⭐⭐☆☆☆", text:"owner made derogatory remarks about my EV", name:"— Dan R."},
  {stars:"⭐⭐⭐⭐⭐", text:"Hard and veiny. The perfect powder coat.", name:"— Chad V."},
  {stars:"⭐⭐⭐⭐⭐", text:"Got my pipes coated. Now I can see my future in the reflection. And for some reason I'm wearing women's clothes", name:"— Brent T."},
  {stars:"⭐⭐⭐⭐⭐", text:"The ad said  hot singles in my area . 10/10 would do again", name:"— Rick 'The Bolt Guy' M."},
  {stars:"⭐⭐⭐⭐⭐", text:"forget the coating, they have a hole in the bathroom wall", name:"— Bill D."},
  {stars:"⭐⭐⭐⭐⭐", text:"Before Performance Kote: depression. After Performance Kote: still depression, but I can watch myself cry in the headers.", name:"— Matt L."},
  {stars:"⭐⭐⭐⭐⭐", text:"was initially disappointed when I found out the Rim Job, wasn't for my wheels", name:"— Zach W."},
  {stars:"⭐⭐⭐⭐⭐", text:"great place ever since they got rid of the midget and the idiot", name:"— Kyle B."},
  {stars:"⭐⭐⭐⭐⭐", text:"does everyone else get the private shower or am I just special ?.", name:"— Jason L."},
  {stars:"⭐⭐⭐⭐⭐", text:"forget the headers, put a bun in this oven! What a stud !.", name:"— Kimmi K."}
];

export function ReviewsWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
        setFadeOut(false);
      }, 1000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const currentReview = reviews[currentIndex];

  const handleFakeReview = () => {
    toast({
      title: "You're not ready.",
      variant: "destructive",
    });
  };

  return (
    <Card 
      className="p-3 sm:p-6 text-center transition-opacity duration-1000"
      style={{ opacity: fadeOut ? 0 : 1 }}
      data-testid="card-reviews-widget"
    >
      <div className="text-xl sm:text-2xl mb-2 sm:mb-3" data-testid="text-review-stars">
        {currentReview.stars}
      </div>
      <div className="text-sm sm:text-base leading-snug sm:leading-relaxed mb-2 sm:mb-3" data-testid="text-review-content">
        "{currentReview.text}"
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4" data-testid="text-review-author">
        {currentReview.name}
      </div>
      <Button 
        variant="secondary"
        size="sm"
        onClick={handleFakeReview}
        data-testid="button-write-review"
      >
        Write a Review
      </Button>
    </Card>
  );
}
