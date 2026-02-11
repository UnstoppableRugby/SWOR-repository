import React from 'react';
import { Users, Heart, Link2, Shield, Clock, CheckCircle, Upload, Share2, UserPlus } from 'lucide-react';

interface HowItWorksPageProps {
  onExplore: () => void;
  onJoinUnstoppable: () => void;
  onNavigate?: (page: string) => void;
}

const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onExplore, onJoinUnstoppable, onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
      {/* Hero */}
      <div className="bg-[#1A2332] py-10 sm:py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4">
            The Full Explainer
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#F5F1E8] leading-tight mb-4 sm:mb-6">
            How Rugby Journeys Work on SWOR
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#F5F1E8]/80 leading-relaxed max-w-3xl">
            A calm, considered approach to preserving rugby's stories. No rush, no pressure. 
            Your journey unfolds at your own pace.
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="py-10 sm:py-14 md:py-16 bg-[#F5F1E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-5 sm:mb-8">
            What Makes This Different
          </h2>
          
          <div className="swor-longform space-y-4 sm:space-y-6">
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              SWOR is not a social network. There are no likes, no followers, no trending lists. 
              We do not measure engagement or reward attention-seeking behaviour.
            </p>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              Instead, we offer a quiet space where rugby journeys can be documented, connected, 
              and preserved for future generations. Every journey matters equally, whether you 
              played one match or a hundred internationals.
            </p>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              The system is designed for people of all ages, including those who may not be 
              comfortable with technology. If you can read this, you can contribute.
            </p>
          </div>

          {/* Core Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-12">
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#8B9D83]/20 flex items-center justify-center mb-3 sm:mb-4">
                <Shield className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-[#8B9D83]" />
              </div>
              <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">Nothing Without Approval</h3>
              <p className="text-[#1A2332]/70 text-sm sm:text-base leading-relaxed">
                You review everything before it goes live. No auto-publishing, no surprises.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#B8826D]/20 flex items-center justify-center mb-3 sm:mb-4">
                <Heart className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-[#B8826D]" />
              </div>
              <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">Acknowledgement First</h3>
              <p className="text-[#1A2332]/70 text-sm sm:text-base leading-relaxed">
                Every journey includes space to acknowledge those who helped along the way.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#1A2332]/10 flex items-center justify-center mb-3 sm:mb-4">
                <Link2 className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-[#1A2332]" />
              </div>
              <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">Connected, Not Isolated</h3>
              <p className="text-[#1A2332]/70 text-sm sm:text-base leading-relaxed">
                Your journey links to clubs, people, and moments, building a living archive.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#8B9D83]/20 flex items-center justify-center mb-3 sm:mb-4">
                <Clock className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-[#8B9D83]" />
              </div>
              <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">Built to Last</h3>
              <p className="text-[#1A2332]/70 text-sm sm:text-base leading-relaxed">
                Content passes the 10-year test. Would this still feel fair and accurate in a decade?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The Three Stages */}
      <div className="py-10 sm:py-14 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">
            The Three Stages
          </h2>
          <p className="text-[#1A2332]/70 mb-8 sm:mb-10 md:mb-12 text-sm sm:text-base md:text-lg">
            Every journey can grow at its own pace. Start simple, add depth when ready.
          </p>

          {/* Stage 1 */}
          <div className="mb-10 sm:mb-14 md:mb-16">
            <div className="flex items-start mb-4 sm:mb-5 md:mb-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#B8826D] flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                <span className="text-[#F5F1E8] font-medium text-sm sm:text-base">1</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332] mb-1">Core Journey</h3>
                <p className="text-xs sm:text-sm text-[#8B9D83]">Fast, calm, complete in minutes</p>
              </div>
            </div>
            
            <div className="bg-[#F5F1E8] rounded-xl p-4 sm:p-5 md:p-6 ml-11 sm:ml-13 md:ml-14">
              <p className="text-[#1A2332]/80 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                The foundation of every rugby journey. Simple prompts, optional image, 
                basic information. AI assistance available if you want it.
              </p>
              <ul className="space-y-2.5 sm:space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2.5 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-[#1A2332]/70 text-sm sm:text-base">Your name and connection to rugby</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2.5 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-[#1A2332]/70 text-sm sm:text-base">Roles in the game (multiple allowed)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2.5 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-[#1A2332]/70 text-sm sm:text-base">Short narrative in your own words</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2.5 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-[#1A2332]/70 text-sm sm:text-base">Links and references (remembered for later)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2.5 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-[#1A2332]/70 text-sm sm:text-base">Review and approval before publishing</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="mb-10 sm:mb-14 md:mb-16">
            <div className="flex items-start mb-4 sm:mb-5 md:mb-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#8B9D83] flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                <span className="text-[#F5F1E8] font-medium text-sm sm:text-base">2</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332] mb-1">Context and Connections</h3>
                <p className="text-xs sm:text-sm text-[#8B9D83]">Optional, when you are ready</p>
              </div>
            </div>
            
            <div className="bg-[#F5F1E8] rounded-xl p-4 sm:p-5 md:p-6 ml-11 sm:ml-13 md:ml-14">
              <p className="text-[#1A2332]/80 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                Two separate actions, available after your core journey is published:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white rounded-lg p-3 sm:p-4">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8826D] mr-2 flex-shrink-0" />
                    <span className="font-medium text-[#1A2332] text-sm sm:text-base">Invite Others to Add Context</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#1A2332]/60 leading-relaxed">
                    Ask teammates, family, or friends to share their perspective on your journey.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-3 sm:p-4">
                  <div className="flex items-center mb-2 sm:mb-3">
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2 flex-shrink-0" />
                    <span className="font-medium text-[#1A2332] text-sm sm:text-base">Invite Someone to Begin</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#1A2332]/60 leading-relaxed">
                    Encourage someone else to start their own rugby journey on SWOR.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 3 */}
          <div>
            <div className="flex items-start mb-4 sm:mb-5 md:mb-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#1A2332] flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                <span className="text-[#F5F1E8] font-medium text-sm sm:text-base">3</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332] mb-1">Full Interactive Journey</h3>
                <p className="text-xs sm:text-sm text-[#8B9D83]">Optional, ongoing, collaborative</p>
              </div>
            </div>
            
            <div className="bg-[#F5F1E8] rounded-xl p-4 sm:p-5 md:p-6 ml-11 sm:ml-13 md:ml-14">
              <p className="text-[#1A2332]/80 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                For those who want to build a comprehensive record. Upload documents, 
                add media, invite collaborators to help fill gaps.
              </p>
              
              <div className="bg-white rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-center mb-2">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8826D] mr-2 flex-shrink-0" />
                  <span className="font-medium text-[#1A2332] text-sm sm:text-base">Upload What You Already Have</span>
                </div>
                <p className="text-xs sm:text-sm text-[#1A2332]/60 leading-relaxed">
                  Word documents, PDFs, images, scans. Dates and names helpful but not required. 
                  We help organise it.
                </p>
              </div>
              
              <div className="swor-reassurance bg-[#8B9D83]/10 rounded-lg p-3 sm:p-4">
                <p className="text-[#1A2332]/70 text-xs sm:text-sm italic leading-relaxed">
                  You do not need to organise anything perfectly. If we can read it and associate it, 
                  we can help place it correctly.
                </p>
              </div>
              
              <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-3 sm:mt-4">
                You can stop at any point and return later. Partial journeys are valid.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Types */}
      <div className="py-10 sm:py-14 md:py-16 bg-[#F5F1E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-5 sm:mb-8">
            Types of Rugby Journeys
          </h2>
          
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
              <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">Your Rugby Journey</h3>
              <p className="text-[#1A2332]/70 mb-2 sm:mb-3 text-sm sm:text-base leading-relaxed">
                For individuals. Players, coaches, referees, volunteers, supporters, administrators, 
                journalists, photographers, medical staff, groundskeepers. Anyone whose life has 
                been shaped by rugby.
              </p>
              <p className="text-xs sm:text-sm text-[#8B9D83]">
                Multiple concurrent roles are welcome. Most people wear many hats.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
              <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">Our Rugby Journey</h3>
              <p className="text-[#1A2332]/70 mb-2 sm:mb-3 text-sm sm:text-base leading-relaxed">
                For collectives. Clubs, schools, universities, charities, foundations, media organisations, 
                archives, museums, businesses that support the game.
              </p>
              <p className="text-xs sm:text-sm text-[#8B9D83]">
                Framed as memory keepers and stewards, not channels or advertisers.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6">
              <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">The Journey of...</h3>
              <p className="text-[#1A2332]/70 mb-2 sm:mb-3 text-sm sm:text-base leading-relaxed">
                For events, tournaments, initiatives, and moments. The story of a particular match, 
                a tour, a championship, a community project.
              </p>
              <p className="text-xs sm:text-sm text-[#8B9D83]">
                Documented as it existed at the time, with governance context preserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledgement */}
      <div className="py-10 sm:py-14 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">
            Acknowledgement is Mandatory
          </h2>
          
          <div className="swor-longform space-y-4 sm:space-y-5 md:space-y-6">
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              Every rugby journey includes space to acknowledge the people, clubs, communities, 
              and organisations that made it possible. This is not optional.
            </p>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              We do not frame anyone as a lone hero or solo achiever. Rugby is a team sport, 
              and the journeys within it are collective by nature.
            </p>
            <p className="text-[#1A2332]/60 text-xs sm:text-sm leading-relaxed">
              Acknowledgement does not imply endorsement, ownership, or promotion. It simply 
              recognises contribution.
            </p>
          </div>
        </div>
      </div>

      {/* Sharing */}
      <div className="py-10 sm:py-14 md:py-16 bg-[#F5F1E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">
            Sharing Your Journey
          </h2>
          
          <div className="swor-longform space-y-4 sm:space-y-5 md:space-y-6">
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              After your journey is approved and published, you can share it with family, 
              friends, and community. Sharing appears at the end of your journey page and in the footer.
            </p>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              Available channels: copy link, email, WhatsApp, and selected social platforms.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 mt-6 sm:mt-8">
            <p className="text-[#1A2332]/70 text-xs sm:text-sm mb-2">Default share message (you can edit this):</p>
            <p className="text-[#1A2332] italic text-sm sm:text-base leading-relaxed">
              "This is a Rugby Journey shared on Small World of Rugby, a space for preserving 
              how the game has shaped lives and communities."
            </p>
          </div>
          
          <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-4 sm:mt-6 leading-relaxed">
            There are no share counts or metrics. We do not track or display how many times 
            a journey has been viewed or shared.
          </p>
        </div>
      </div>

      {/* Posthumous & Living Legacy */}
      <div className="py-10 sm:py-14 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">
            Posthumous and Living Legacy
          </h2>
          
          <div className="swor-longform space-y-4 sm:space-y-5 md:space-y-6">
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              SWOR explicitly supports posthumous rugby journeys. Family members and friends 
              can create and maintain journeys on behalf of those who have passed.
            </p>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              Full legacy profiles can be made available privately to family and friends, 
              with public visibility controlled by those with stewardship.
            </p>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              Living legacies can be enriched by others over time, with proper consent and 
              attribution. A journey is never truly finished.
            </p>
          </div>
        </div>
      </div>

      {/* Governance */}
      <div className="py-10 sm:py-14 md:py-16 bg-[#1A2332]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#F5F1E8] mb-4 sm:mb-6">
            Governance and Affiliation
          </h2>
          
          <div className="space-y-4 sm:space-y-5 md:space-y-6 text-[#F5F1E8]/80 text-sm sm:text-base md:text-lg">
            <p className="leading-relaxed">
              Rugby's governance structures vary across time and geography. SWOR recognises that 
              provinces, states, counties, and regions may function as unions in their own right.
            </p>
            <p className="leading-relaxed">
              We document governance as it existed at the time, without imposing global consistency. 
              Relationships and affiliations are described, not standardised.
            </p>
            <p className="leading-relaxed">
              SWOR Rugby Journeys are the sole canonical public versions. All enrichment, collaboration, 
              and future additions occur on SWOR, ensuring a single source of truth that can grow and 
              deepen over time.
            </p>
          </div>
        </div>
      </div>


      {/* CTAs */}
      <div className="py-10 sm:py-14 md:py-16 bg-[#F5F1E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <button
              onClick={() => onNavigate?.('contribute')}
              className="swor-btn-primary text-left p-5 sm:p-6 md:p-8 rounded-xl h-auto flex flex-col items-start min-h-[140px] sm:min-h-[160px] active:scale-[0.98] transition-transform"
            >
              <h3 className="font-serif text-base sm:text-lg md:text-xl mb-2">Begin Your Rugby Journey</h3>
              <p className="text-[#F5F1E8]/80 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                Start with the basics. Add depth when you are ready.
              </p>
              <span className="text-xs sm:text-sm font-medium mt-auto">Get started</span>
            </button>

            <button
              onClick={onExplore}
              className="swor-btn-secondary text-left p-5 sm:p-6 md:p-8 rounded-xl h-auto flex flex-col items-start min-h-[140px] sm:min-h-[160px] active:scale-[0.98] transition-transform"
            >
              <h3 className="font-serif text-base sm:text-lg md:text-xl mb-2">Explore Rugby Journeys</h3>
              <p className="text-[#F5F1E8]/80 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                Discover how others have documented their connection to the game.
              </p>
              <span className="text-xs sm:text-sm font-medium mt-auto">Explore</span>
            </button>
          </div>
          
          {/* Read the full explainer link */}
          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <p className="text-[#1A2332]/60 text-xs sm:text-sm leading-relaxed">
              Questions? Contact us or explore the{' '}
              <button 
                onClick={() => onNavigate?.('governance')}
                className="swor-link inline min-h-[44px]"
              >
                governance and stewardship
              </button>{' '}
              page for more detail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
