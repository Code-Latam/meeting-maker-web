import React from 'react';
import { useNavigate } from 'react-router-dom';

export function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-lg">
        {/* Header */}
        <div className="bg-primary-600 text-white p-5 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Meeting Maker Guide</h1>
              <p className="text-sm opacity-90">Complete instructions for setting up and using your AI outreach assistant</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors text-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* What is Meeting Maker? */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">
              What is Meeting Maker? <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">Astrolab AI</span>
            </h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Meeting Maker (Astrolab Meeting Maker) is an AI-powered platform that leverages AI to manage all your outbound and inbound LinkedIn activity AND email outreach.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Create AI agents for multiple roles: SDR, BDR, Recruiter, Researcher, SEO Manager, and more.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Assign people or let campaigns find leads automatically with AI qualification.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Agents connect, message, follow up intelligently, and guide leads toward your goal (meeting, subscription, email capture) across both LinkedIn and email channels.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Track everything in dashboards and detailed people lists with state filters.
              </li>
            </ul>
          </section>

          {/* Getting Started */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">Getting Started</h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Create your account at <a href="https://www.meetingmaker.tech" target="_blank" className="text-primary-600 hover:underline">www.meetingmaker.tech</a> → Login → Register.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Log into the Meeting Maker web app using your credentials.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                The app is fully responsive and works on both desktop and mobile devices.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Navigate using the sidebar (desktop) or bottom navigation (mobile).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Make sure you are logged into LinkedIn in the same browser for LinkedIn features to work.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Verify that the LinkedIn connection indicator shows "Connected" in the app.
              </li>
            </ul>
          </section>

          {/* Creating Your First Agent */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">
              Creating Your First Agent <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">Persona & goals</span>
            </h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Go to the <strong>Agents</strong> tab in the main navigation.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Click <strong>Create Agent</strong>.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Enter a clear name for your agent (e.g., "SDR - ABC Corp").
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Select a role: SDR, BDR, Recruiter, Researcher, SEO Manager, or other available roles.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Important:</strong> You can let the agent handle two types of funnels, each with their own connection and message limits — LinkedIn and Email. Configure limits separately for each channel based on your account standing and outreach strategy.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Persona (critical):</strong> Describe who you are, what your company does, the problem you solve, and how you help customers. Include pricing or value props. More detail = better AI performance. You can use the <strong>"Generate Persona"</strong> button with website data to auto-generate this.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Goal(s):</strong> Define primary goal (Book Meeting, Generate Subscription, Collect Email, or Custom). Add your calendar link (Calendly, etc.) or subscription link. You can also define a fallback goal (e.g., primary = meeting, fallback = newsletter signup).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Services:</strong> Add each service individually using the "+" button. Be specific: who it's for and what problem it solves. The agent uses this in conversations. You can use the <strong>"Generate Services"</strong> button with website data to auto-generate these.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Allowed / disallowed actions:</strong> Optional — adjust later if needed.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Daily limits:</strong>
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li><strong>LinkedIn:</strong> New accounts → 15 connections / 60 messages. Established accounts (2000+ connections) → 20+ connections / 100+ messages.</li>
                  <li><strong>Email:</strong> Set limits between 50 and 200 messages per day. Start with 50 messages per day and increase gradually as your email infrastructure warms up.</li>
                </ul>
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Tone & Follow-ups:</strong> Select professional (recommended) or casual. Set number of follow-ups (2-4 recommended, max 4).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Click <strong>Save</strong> — your agent is ready.
              </li>
            </ul>
          </section>

          {/* Types of Agents */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">Types of Agents</h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>SDR (Sales Development Representative):</strong> Starts conversations, qualifies leads, moves prospects toward goal.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>BDR (Business Development Representative):</strong> Focuses on outreach, identifying opportunities, and building pipeline — similar behavior to SDR.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Recruiter:</strong> Optimized for talent sourcing and candidate engagement.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Researcher:</strong> Gathers information, qualifies prospects based on deep criteria, and feeds intelligence back to your team.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>SEO Manager:</strong> Automatically creates blog articles on your website and publishes daily LinkedIn posts to build authority and improve search/AI visibility.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Additional roles available depending on your subscription.
              </li>
            </ul>
          </section>

          {/* Assigning People to Agents */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">
              Assigning People to Agents <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">3 methods + Campaign AI</span>
            </h2>

            <h3 className="text-base font-semibold text-primary-700 mt-4 mb-2">1. Individually</h3>
            <ul className="space-y-2 mb-4">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Go to a LinkedIn profile page.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Use the "Add to Meeting Maker" option to assign the person to an agent.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Choose an agent and a group (or create a new group).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                The person will appear in the agent's persons list.
              </li>
            </ul>

            <h3 className="text-base font-semibold text-primary-700 mt-4 mb-2">2. Using LinkedIn Lists (bulk export)</h3>
            <ul className="space-y-2 mb-4">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Use LinkedIn search filters (people, posts, companies) to build your target list.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Go to the <strong>Agents</strong> tab and select your agent.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Use the export functionality to add profiles in bulk.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                All profiles from selected pages will be added to the agent.
              </li>
            </ul>

            <h3 className="text-base font-semibold text-primary-700 mt-4 mb-2">3. Campaigns (Premium) <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">AI qualification + continuous</span></h3>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Prerequisite:</strong> Premium account required (campaign icon appears as bars icon next to agent).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Click the bars icon (📊) next to the agent name → creates a new campaign.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Define filters (location, title, keywords, etc.) and AI confidence threshold.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Agent automatically searches, qualifies leads (beyond simple filters) based on your ideal customer profile, and assigns only qualified leads.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Campaigns run continuously until paused or deleted — they add new leads automatically without manual intervention.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                A group with the campaign name is created automatically for tracking.
              </li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 text-sm">
              🚀 Campaigns not only use filters but also evaluate if a person truly matches your target audience using AI confidence scoring.
            </div>
          </section>

          {/* What Agents Do */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">What Agents Do (LinkedIn + Email Funnels)</h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>LinkedIn Funnel:</strong>
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>Send connection requests (respecting daily limits).</li>
                  <li>Start conversations using your persona and services.</li>
                  <li>Follow up automatically based on your follow-up settings (2-4 times).</li>
                  <li>Guide leads toward primary or fallback goal (offering calendar link, subscription, etc.).</li>
                </ul>
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Email Funnel (in addition to LinkedIn):</strong>
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>Agents can also manage email outreach sequences alongside LinkedIn messaging.</li>
                  <li>Capture emails through conversations or dedicated email capture goals.</li>
                  <li>Send automated follow-up emails to prospects who have engaged but not yet converted.</li>
                  <li>Coordinate touchpoints across both channels for a unified outreach strategy.</li>
                  <li>Track email open rates, reply rates, and conversion metrics in the dashboard.</li>
                </ul>
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>For SEO agent:</strong> auto-publish blog articles + daily LinkedIn posts with your branded image.
              </li>
            </ul>
          </section>

          {/* Agent People List */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">
              Agent People List <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">States & conversation view</span>
            </h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                In the <strong>Agents</strong> tab, click the Persons icon (👥) next to any agent.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                View all assigned people with powerful filters: Group, State, Name, Date range.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>State filter options:</strong> Open, Connected, Pending Connection, In Conversation, Paused, Converted, Irrelevant, Do Not Contact, Archived, Blocked.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Switch between <strong>LinkedIn Funnel</strong> and <strong>Email Funnel</strong> views to see channel-specific states.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Click any person's card → LinkedIn opens directly. From there, open the messages window to review the full conversation history between the agent and that person.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Monitor individual progress, identify hot leads, and adjust strategy per group.
              </li>
            </ul>
          </section>

          {/* Dashboard */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">
              Dashboard <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">Full metrics & trends</span>
            </h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Go to the <strong>Dashboard</strong> tab in the main navigation.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                View metrics with channel switching between LinkedIn and Email funnels.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Key metrics tracked:</strong>
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>📤 Connection requests sent</li>
                  <li>✅ Connection acceptance rate</li>
                  <li>💬 LinkedIn messages sent & conversation rate</li>
                  <li>✉️ Email messages sent, open rate, reply rate</li>
                  <li>📅 Meeting booking rate</li>
                  <li>🎯 Conversion rate (goal completion)</li>
                </ul>
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                View <strong>Daily Connections Chart</strong> showing connections added over time.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Analyze <strong>Leads Over Time</strong> charts and <strong>Conversion Funnel</strong> visualizations.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                <strong>Groups Performance</strong> page compares performance across different groups and campaigns, sorted by Connection → Conversion rate.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                System-wide insights help you optimize personas, limits, and targeting.
              </li>
            </ul>
          </section>

          {/* SEO Agent Setup */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">
              SEO Agent Setup <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">Auto-blog + LinkedIn posts</span>
            </h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Go to <a href="https://www.meetingmaker.tech" target="_blank" className="text-primary-600 hover:underline">www.meetingmaker.tech</a> → login → dashboard.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Open the Blog tab → enable Blog feature and enable "Post on LinkedIn".
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Upload your branded image (used in LinkedIn posts). Changes save automatically.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Copy the widget script from dashboard and paste it into your website's blog page (simple developer task).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Now create an SEO Manager agent in the app:
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>Role = SEO Manager, Goal = writing articles.</li>
                  <li>Persona: describe who you are and what topics to write about (reuse services from other agents).</li>
                  <li>Set connections and messages to zero.</li>
                  <li>Save agent.</li>
                </ul>
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                From that point, the agent automatically creates 1 article on your website + 1 LinkedIn post per day (per SEO agent). You can create multiple SEO agents for more content.
              </li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 text-sm">
              📈 SEO agent builds your authority over time, improves Google ranking, and increases visibility in AI tools like ChatGPT.
            </div>
          </section>

          {/* Boost Tab */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">
              Boost Tab <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">Post boosting</span>
            </h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Go to the <strong>Boost</strong> tab in the main navigation.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Submit one LinkedIn post per day to be boosted by the Meeting Maker network.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Enter the LinkedIn post URL (format: https://www.linkedin.com/feed/update/urn:li:activity:XXXXXXXXXX/).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Toggle "This is my own LinkedIn post" if you're submitting your own content (this prevents self-engagement).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Status will be updated by our backend process: <strong>Pending → Boosted or Failed</strong>.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                You can delete pending or failed posts and submit a new one.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Refresh status at any time to see the latest progress.
              </li>
            </ul>
          </section>

          {/* Best Practices & Important Notes */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-bold text-primary-600 mb-3">Best Practices & Important Notes</h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Create multiple specialized agents (different personas, services, goals, and roles like SDR, BDR, Researcher, Recruiter).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Keep personas detailed and accurate — AI performance depends on quality input. Use the <strong>Generate Persona</strong> feature to help.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Use campaigns (Premium) to scale outreach with AI qualification and continuous lead addition.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Monitor dashboard regularly to track acceptance rates, email metrics, and conversion trends.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Respect daily LinkedIn limits to keep your account safe. Start conservative (15 connections / 60 messages).
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                For email outreach, start with 50 messages per day and increase gradually up to 200 as your email domain warms up.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Leverage both LinkedIn and email funnels for multi-channel outreach — this typically increases conversion rates.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Review conversation history via People List to refine persona and allowed actions.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Set follow-ups between 2-4 messages — exceeding four is not recommended.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                The app is fully responsive — use it on desktop, tablet, or mobile with the same functionality.
              </li>
            </ul>
          </section>

          {/* Need More Help? */}
          <section className="pb-4">
            <h2 className="text-lg font-bold text-primary-600 mb-3">Need More Help?</h2>
            <ul className="space-y-2">
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Check the <strong>About</strong> section in the app for links to detailed tutorial videos.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                Each feature (account setup, agent creation, campaigns, people list, dashboards, email funnel) has step-by-step video guides.
              </li>
              <li className="bg-gray-50 border-l-4 border-primary-600 p-3 rounded-r-lg text-sm">
                For support or questions, contact Meeting Maker via <a href="mailto:info@meetingmaker.tech" className="text-primary-600 hover:underline">info@meetingmaker.tech</a>.
              </li>
            </ul>
          </section>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 text-xs text-gray-500">
            Meeting Maker by Saasential LLC — Updated with Astrolab AI features
          </div>
        </div>
      </div>
    </div>
  );
}