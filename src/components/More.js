import React from "react";

// Reusable component to display individual team profiles
const TeamProfile = ({ teamName, history, landscape, academics, coaching }) => {
  // Helper function to render paragraphs from text potentially containing multiple '\n'
  const renderParagraphs = (text) => {
    if (!text) return null;
    return text.split('\n').map((paragraph, index) => (
      paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
    ));
  };

  return (
    <section className="team-profile">
      <h2>{teamName}</h2>
      {history && (
        <div>
          <h3>Football History</h3>
          {renderParagraphs(history)}
        </div>
      )}
      {landscape && (
        <div>
          <h3>Current Landscape (NIL, Playoff, Conference)</h3>
          {renderParagraphs(landscape)}
        </div>
      )}
      {academics && (
        <div>
          <h3>Academic Standing</h3>
          {renderParagraphs(academics)}
        </div>
      )}
      {coaching && (
        <div>
          <h3>Coaching History</h3>
          {renderParagraphs(coaching)}
        </div>
      )}
    </section>
  );
};


const More = () => {
  // Data for each team (extracted from the provided document snippet)
  const teamsData = [
    {
      teamName: "Air Force Falcons",
      history: `The Air Force Falcons football program has a storied history dating back to its inaugural season in 1955[cite: 18]. Over 68 seasons, the Falcons have amassed an all-time record of 432 wins, 347 losses, and 12 ties[cite: 18]. The program's early years saw them compete as an independent before joining the Western Athletic Conference (WAC) and later becoming a charter member of the Mountain West Conference in 1999[cite: 18]. The Falcons have showcased periods of significant success, including three conference championships in 1985, 1995, and 1998[cite: 18]. Notably, the 1985 season saw the team achieve a remarkable 12-1 record, culminating in a Bluebonnet Bowl victory and a top 10 national ranking[cite: 19]. The 1998 season was equally impressive, with a 12-1 record and a win in the Oahu Bowl[cite: 19].
      The program has also navigated periods of struggle, including seasons with losing records, particularly in the early 2000s and the 2013 season where they finished with a 2-10 record[cite: 19]. Despite these challenges, the Falcons have consistently demonstrated resilience and a commitment to their unique triple-option offensive scheme[cite: 19].
      Over the last 10-15 years (2010-2024), the Air Force Falcons have maintained a competitive presence in the Mountain West Conference[cite: 19]. They achieved a 9-4 record in 2010, winning the Independence Bowl[cite: 20]. The 2011-2014 seasons saw varied results, but the team returned to form with a 10-3 record in 2014, securing a Famous Idaho Potato Bowl victory[cite: 20]. The Falcons continued their success with a 10-3 season in 2016, winning the Arizona Bowl, and an impressive 11-2 record in 2019, capped by a Cheez-It Bowl win and a final ranking in the AP Top 25[cite: 20]. The most recent years have also seen strong performances, with consecutive 10-3 seasons in 2021 and 2022, resulting in wins in the First Responder Bowl and Armed Forces Bowl, respectively[cite: 20, 21]. The 2024 season concluded with a 5-7 record[cite: 21].`,
      landscape: `Name, Image, and Likeness (NIL) policies present a unique situation for the Air Force program[cite: 21]. As a service academy, Air Force athletes are generally not permitted to engage in NIL activities in the same manner as athletes at civilian institutions due to their classification as employees of a military branch[cite: 22]. This could potentially impact their ability to attract and retain players who might be seeking NIL earning opportunities elsewhere[cite: 22]. However, the core values of service, education, and the unique career path offered by the Air Force Academy remain strong draws for many recruits[cite: 23].
      The expanded College Football Playoff format, featuring 12 teams, could offer a more realistic path for the Air Force to compete for a national championship[cite: 23]. While the Falcons would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion, their consistent success in the Mountain West could position them as contenders for this spot[cite: 24]. The new format increases the chances for teams outside the traditional power conferences to make a deep postseason run[cite: 24].
      In terms of conference realignment, Air Force has been a member of the Mountain West Conference since its inception in 1999[cite: 24]. While there were discussions about a potential move to the American Athletic Conference (AAC) in recent years, particularly as other Mountain West teams departed for the Pac-12, Air Force ultimately decided to remain in the Mountain West[cite: 24, 25]. This decision provides stability for the program and allows them to continue competing within a conference where they have a long history and established rivalries[cite: 25]. The Mountain West's financial incentives likely played a role in this decision[cite: 26].`,
      academics: `The United States Air Force Academy is consistently ranked among the top academic institutions in the nation[cite: 26]. U.S. News & World Report's 2025 rankings place the Academy second among Top Public Schools and eighth in Best National Liberal Arts Colleges[cite: 27]. Many of its engineering programs, such as Civil, Electrical, and Mechanical Engineering, are ranked among the top ten nationally for schools where a doctorate is not offered[cite: 27].
      The Academy offers a balanced curriculum that includes basic sciences, engineering, social sciences, and humanities, with cadets choosing from 31 major areas of study[cite: 27]. Popular majors include management, biology, behavioral science, and various engineering disciplines[cite: 27]. The Academy also boasts a comprehensive international education program and supports graduate studies for cadets pursuing advanced degrees[cite: 27, 28].
      Founded in 1954, the Air Force Academy has a strong tradition of academic excellence, preparing future leaders for service in the Air Force and Space Force[cite: 28]. Each cadet graduates with a Bachelor of Science degree and a commission as a second lieutenant[cite: 28].`,
      coaching: `Troy Calhoun has been the head coach of the Air Force Falcons since December 2006[cite: 28]. His tenure has been marked by consistent winning seasons and multiple bowl game appearances[cite: 28]. Prior to Calhoun, Fisher DeBerry led the program for 23 seasons, from 1984 to 2006, becoming the winningest coach in Air Force history with 169 wins[cite: 28]. Ken Hatfield also had a successful stint from 1979 to 1983[cite: 28, 29]. Over the last 10-15 years, Troy Calhoun has provided stability and continued the program's tradition of strong football[cite: 29].`,
    },
    {
      teamName: "Akron Zips",
      history: `The Akron Zips football program boasts a long history, with its first season dating back to 1891 when the institution was known as Buchtel College[cite: 29]. Officially adopting the "Zips" moniker in 1914, the program has navigated various conferences, including the Ohio Athletic Conference, the Mid-Continent Conference, and the Mid-American Conference (MAC), which they joined in 1992[cite: 29]. Over their history, the Zips have accumulated an all-time record of 534 wins, 602 losses, and 36 ties through the 2023 season[cite: 29, 30].
      The Zips experienced a period of significant success in the mid-1960s to early 1970s under coach Gordon Larson, winning 38 games between 1968 and 1971 and appearing in the 1968 Grantland Rice Bowl[cite: 30]. More recently, the program achieved its first MAC championship in 2005 under coach J.D. Brookhart, leading to their inaugural Division I-A bowl game appearance in the Motor City Bowl[cite: 30].
      The Zips have also faced periods of struggle, including multiple seasons with losing records, particularly in the late 1990s and early 2000s[cite: 30]. The 2019 season was particularly challenging, with the team finishing 0-12[cite: 30].
      Looking at the last 10-15 years (2010-2024), the Akron Zips have primarily competed in the MAC[cite: 30, 31]. The 2015 season, under coach Terry Bowden, saw the team achieve an 8-5 record and win the Famous Idaho Potato Bowl[cite: 32]. However, the program has largely experienced inconsistency during this period, with multiple seasons recording only one or two wins[cite: 32]. The 2024 season concluded with a 4-8 record[cite: 32].`,
      landscape: `Name, Image, and Likeness (NIL) policies are becoming increasingly important for programs like Akron to remain competitive[cite: 32]. The university has partnered with INFLCR to provide student-athletes with tools and resources to maximize their NIL opportunities through the Go Zips Exchange[cite: 33]. Additionally, the Nickel City Collective serves as a NIL collective benefiting Buffalo student-athletes, indicating a growing trend in the region[cite: 33]. While specific NIL deals for Akron football players may vary, the program is actively working to enhance these opportunities for its athletes[cite: 33].
      The expanded College Football Playoff format offers a glimmer of hope for teams like Akron[cite: 33]. While the path to a national championship remains challenging, the increased number of playoff spots could potentially allow a MAC champion to compete on a larger stage, provided they achieve a high enough ranking[cite: 34]. The expanded access could incentivize strong performances within the conference[cite: 34].
      Akron has been a member of the Mid-American Conference since 1992[cite: 34]. Recent conference realignments have seen UMass join the MAC as a full-time member starting in 2025, which could impact scheduling and competitive dynamics within the conference[cite: 34]. The MAC has eliminated its East and West divisions starting in 2024, with the top two teams competing in the MAC Football Championship Game[cite: 34, 35]. This new scheduling model aims to create more balanced competition within the conference[cite: 35].`,
      academics: `The University of Akron is recognized as a top university in Akron, United States, with QS World University Rankings placing it in the #301-350 range for 2025[cite: 35]. U.S. News & World Report ranks the university at #377 in the National Universities category for 2025[cite: 35].
      The university offers a wide array of programs across various fields through its colleges, including the Buchtel College of Arts and Sciences, the College of Business, the College of Engineering and Polymer Science, and the College of Health and Human Sciences[cite: 35, 36]. Notable programs include the world's first courses in rubber chemistry, strong STEM programs, and the Archives of the History of American Psychology[cite: 36].
      Founded in 1870, the University of Akron has a long history of serving the region and has evolved into a comprehensive doctoral university with a strong emphasis on research, classified as an R2 institution[cite: 36].`,
      coaching: `Joe Moorhead is the current head coach of the Akron Zips, taking the position in 2022[cite: 36]. He has a career record of 8-28 at Akron through the 2024 season[cite: 36].
      Prior to Moorhead, Terry Bowden served as the head coach from 2012 to 2018, leading the team to a Famous Idaho Potato Bowl victory in 2015[cite: 36, 37]. Rob Ianello coached the team in 2010 and 2011, and J.D. Brookhart led the Zips from 2004 to 2009, guiding them to their MAC Championship win in 2005[cite: 37]. Over the last 10-15 years, the program has seen several coaching changes as it strives to build sustained success[cite: 37].`,
    },
    {
      teamName: "Alabama Crimson Tide",
      history: `The Alabama Crimson Tide football program stands as one of the most storied and successful in the history of college football, with its first season dating back to 1892[cite: 37]. The Crimson Tide boasts an all-time record of 974 wins, 341 losses, and 43 ties[cite: 37, 38]. The program has a rich tradition of excellence, claiming 18 national championships, including 13 from major wire-service polls[cite: 38].
      Alabama's history is marked by numerous periods of dominance, particularly under legendary coaches like Paul "Bear" Bryant, who led the Crimson Tide to six national titles between 1958 and 1982[cite: 38]. The program also experienced remarkable success under Nick Saban, who added six more national championships from 2009 to 2020[cite: 38]. The Crimson Tide holds the NCAA record for most bowl appearances (78) and most bowl victories (46)[cite: 38].
      While periods of such sustained success inherently include very few struggles, the program has faced occasional challenges[cite: 38]. Prior to Bryant's arrival, the team had periods without national prominence[cite: 39]. Additionally, the program has had to navigate NCAA sanctions, including vacated victories[cite: 40].
      Over the last 10-15 years (2010-2024), Alabama has maintained its position as a national powerhouse[cite: 40]. Under Nick Saban, the Crimson Tide won national championships in 2011, 2012, 2015, 2017, and 2020[cite: 41]. The team consistently appeared in the College Football Playoff, winning titles in 2015, 2017, and 2020[cite: 41]. Following Saban's retirement after the 2023 season, Kalen DeBoer took over as head coach for the 2024 season, leading the team to a 9-4 record and an appearance in the ReliaQuest Bowl[cite: 41].`,
      landscape: `Alabama is exceptionally well-positioned to capitalize on Name, Image, and Likeness (NIL) policies[cite: 41]. The program boasts a strong brand and a passionate alumni base, facilitating numerous NIL opportunities for its student-athletes[cite: 42]. Alabama consistently ranks among the top programs in terms of NIL collective resources, ensuring that its players have the financial support necessary to remain competitive in the evolving landscape of college football[cite: 42]. The state of Alabama has even proposed legislation to exempt NIL earnings from state income tax, potentially giving its universities a recruiting advantage[cite: 42].
      The expanded College Football Playoff format further enhances Alabama's chances of competing for national championships[cite: 42]. With its consistent top-tier rankings and history of success, Alabama is expected to be a regular participant in the 12-team playoff[cite: 43]. The new format provides a greater margin for error during the regular season while still offering a clear path to the national title game for elite programs like Alabama[cite: 43].
      Alabama has been a cornerstone member of the Southeastern Conference (SEC) since its formation in 1932[cite: 43]. The conference's decision to eliminate divisional standings in 2024 and move to a single-division format with the addition of Oklahoma and Texas will create a more competitive and balanced league[cite: 43]. Alabama's traditional rivalries, such as the Iron Bowl against Auburn, will continue to be highly anticipated annual events[cite: 43, 44].`,
      academics: `The University of Alabama is a highly ranked public research university[cite: 44]. U.S. News & World Report's 2025 rankings place the university at #171 among National Universities and second in the state of Alabama[cite: 45]. The university holds R1: Very High Research Activity status in the Carnegie Classification of Institutions of Higher Education[cite: 45].
      The University of Alabama offers a wide range of academic programs, with over 200 undergraduate majors and numerous graduate programs across its colleges and schools, including the Culverhouse College of Business, the College of Engineering, and the Capstone College of Nursing[cite: 45]. The university is particularly strong in areas such as business, engineering, and nursing, with programs consistently earning high national rankings[cite: 45].
      Founded in 1831, the University of Alabama has a long and distinguished tradition of academic excellence, consistently producing graduates who become leaders in their respective fields[cite: 45, 46]. The university is committed to student success, demonstrated by its high retention and graduation rates[cite: 46].`,
      coaching: `Kalen DeBoer is the current head coach of the Alabama Crimson Tide, taking over in January 2024 following the retirement of Nick Saban[cite: 46]. DeBoer has a strong track record, including a successful tenure at the University of Washington[cite: 46].
      Nick Saban coached the Crimson Tide from 2007 to 2023, establishing an unparalleled era of dominance with six national championships[cite: 47]. Prior to Saban, legendary coaches such as Paul "Bear" Bryant (1958-1982) and Gene Stallings (1990-1996) also led Alabama to national championship glory[cite: 47]. The program has a rich history of stable and successful coaching leadership[cite: 47].`,
    },
    {
        teamName: "Appalachian State Mountaineers",
        history: `The Appalachian State Mountaineers football program has a rich history dating back to 1928[cite: 47]. Over the years, the Mountaineers have compiled a record of success, transitioning from the Southern Conference to the Sun Belt Conference, where they currently compete[cite: 47].
        Appalachian State achieved significant success at the FCS level, winning three consecutive national championships from 2005 to 2007 under coach Jerry Moore[cite: 47, 48]. This period established the program as a national force within the subdivision[cite: 48].
        The Mountaineers transitioned to the FBS level in 2014 and quickly established themselves as a competitive program in the Sun Belt Conference[cite: 49]. They have secured multiple Sun Belt Conference championships since joining the FBS, demonstrating their ability to compete at the highest level[cite: 49].
        Over the last 10-15 years (2010-2024), Appalachian State has shown consistent success[cite: 49]. Their transition to FBS in 2014 marked a significant period of success, including multiple bowl game appearances and Sun Belt Conference titles[cite: 50]. The program has maintained a reputation for strong on-field performance within the Sun Belt[cite: 51].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role in Appalachian State's ability to attract and retain players[cite: 52]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 53].
        The expanded College Football Playoff format could create new opportunities for Appalachian State[cite: 53]. As a member of the Sun Belt Conference, the Mountaineers would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 54]. Consistent success within the Sun Belt would be crucial for positioning themselves as a top Group of 5 contender[cite: 54].
        Appalachian State is currently a member of the Sun Belt Conference[cite: 54]. Recent conference realignments have significantly impacted the FBS landscape, with teams shifting between conferences[cite: 54]. While the provided snippets do not offer specific information on how these realignments might directly affect Appalachian State, their continued membership in a stable Sun Belt Conference provides a consistent competitive environment[cite: 55].`,
        academics: `Appalachian State University is a four-year public university located in Boone, North Carolina[cite: 55]. While the provided snippets do not offer specific academic rankings from sources like U.S. News & World Report, Appalachian State is generally recognized as a comprehensive university offering a variety of undergraduate and graduate programs[cite: 55]. The university has a history and tradition in academics, providing educational opportunities to students in North Carolina and beyond since its founding[cite: 57].`,
        coaching: `The provided snippets do not list the specific head coaches of Appalachian State over the last 10-15 years[cite: 58]. However, it is noted that Jerry Moore coached the team during their successful FCS run[cite: 59]. Further research would be needed to detail the coaching history within the last 10-15 years[cite: 59].`,
    },
    {
        teamName: "Arizona Wildcats",
        history: `The Arizona Wildcats football program has a long history, with its inaugural season in 1899[cite: 60]. The Wildcats have an all-time record of 636 wins, 502 losses, and 33 ties[cite: 60]. The program has been affiliated with several conferences throughout its history, including the Border Conference, the WAC, and the Pac-12, before joining the Big 12 in 2024[cite: 60]. The Wildcats have won or shared six conference championships[cite: 60].
        Arizona's football program experienced periods of success, particularly in the early part of its history and during the "Desert Swarm" era in the 1990s under coach Dick Tomey, which included a 12-1 season in 1998 and a Holiday Bowl victory[cite: 60]. The team also had a successful run under coach Jim Young in the mid-1970s[cite: 61].
        The program has also faced periods of struggle, with many mediocre and losing seasons, often playing in the shadow of the Wildcats' successful basketball program[cite: 61].
        Looking at the last 10-15 years (2010-2024), the Arizona Wildcats have seen varied performance[cite: 61]. They achieved a 10-4 season in 2014 under coach Rich Rodriguez, winning the Pac-12 South division title and appearing in the Fiesta Bowl[cite: 62]. However, the program has also experienced losing seasons during this period[cite: 62]. The 2023 season under coach Jedd Fisch saw a significant turnaround with a 10-3 record and a win in the Alamo Bowl[cite: 63]. The 2024 season, their first in the Big 12 under new coach Brent Brennan, concluded with a 4-8 record[cite: 63].`,
        landscape: `Name, Image, and Likeness (NIL) is playing an increasingly important role for the Arizona Wildcats[cite: 63]. The Desert Takeover Football Collective is specifically dedicated to supporting Arizona Football student-athletes with NIL opportunities[cite: 64]. This collective aims to help players maximize their brand and engage with the community[cite: 64].
        The expanded College Football Playoff format could offer a more accessible path for the Arizona Wildcats to compete for a national championship[cite: 64]. As a member of the Big 12, a Power Four conference, the Wildcats would have opportunities to earn automatic bids or at-large selections based on their performance and ranking[cite: 65]. Their recent 10-win season in 2023 demonstrates their potential to compete at a high level[cite: 65].
        Arizona's move to the Big 12 Conference in 2024 marks a significant realignment for the program[cite: 65]. This shift ends their long-standing affiliation with the Pac-12 and places them in a conference with new opponents and competitive dynamics[cite: 65]. The Big 12's scheduling model prioritizes geography and rivalries[cite: 65].`,
        academics: `The University of Arizona is a public land-grant research university in Tucson, Arizona[cite: 65]. It is ranked #109 among National Universities in the U.S. News & World Report 2025 rankings[cite: 66]. The university is classified among "R1: Doctoral Universities – Very high research activity" and is a member of the Association of American Universities[cite: 66].
        The University of Arizona offers a wide range of academic programs across 22 colleges and schools, including strong programs in optical sciences, medicine, business, and law[cite: 66]. The university has a strong commitment to research and interdisciplinary studies[cite: 66].
        Founded in 1885, the University of Arizona was the first university established in the Arizona Territory and has a long tradition of academic and research excellence[cite: 66, 67].`,
        coaching: `Brent Brennan became the head coach of the Arizona Wildcats in 2024[cite: 67]. He previously served as the head coach at San Jose State[cite: 67].
        Jedd Fisch coached the Wildcats from 2021 to 2023, leading the team to a successful 10-3 season in his final year[cite: 68]. Kevin Sumlin (2018-2020) and Rich Rodriguez (2012-2017) also served as head coaches in recent years[cite: 68]. The program has seen several coaching changes over the last decade as it aims for sustained success[cite: 68].`,
    },
    {
        teamName: "Arizona State Sun Devils",
        history: `The Arizona State Sun Devils football program has a long and proud history dating back to 1897[cite: 68]. Over its history, the program has amassed an all-time record of 603 wins, 384 losses, and 18 ties[cite: 68]. The Sun Devils have been affiliated with several conferences, including the Border Conference, the WAC, and the Pac-12, before joining the Big 12 in 2024[cite: 68, 69]. Arizona State has won 18 conference championships[cite: 69].
        Arizona State's football history includes periods of significant success, notably under coaches like Frank Kush, who led the Sun Devils to an undefeated season in 1970 and multiple Fiesta Bowl victories[cite: 69]. The program also won the Rose Bowl in 1987 under coach John Cooper[cite: 69].
        While a historically strong program, Arizona State has also faced periods of inconsistency in recent years[cite: 69].
        Looking at the last 10-15 years (2010-2024), the Arizona State Sun Devils have experienced varied levels of success[cite: 69]. They achieved a 10-3 season in 2014 under coach Todd Graham, winning the Pac-12 South division and the Sun Bowl[cite: 70]. Herm Edwards led the team to an 8-5 season in 2019, culminating in a Sun Bowl victory[cite: 70]. Kenny Dillingham took over as head coach in 2023, leading the team to an 11-3 season in 2024, winning the Big 12 Championship and making their first appearance in the expanded College Football Playoff[cite: 70].`,
        landscape: `Name, Image, and Likeness (NIL) policies are playing a crucial role in Arizona State's ability to compete[cite: 70]. The Sun Angel Collective is the official NIL collective of the university, working to create opportunities for student-athletes[cite: 71]. Recent reports indicate that NIL collectives are helping secure commitments from top recruits[cite: 71].
        The expanded College Football Playoff format has already benefited Arizona State, as their Big 12 Championship in 2024 earned them a spot in the 12-team playoff[cite: 71]. This new format provides a more direct path for conference champions to compete for a national title[cite: 71].
        Arizona State's move to the Big 12 Conference in 2024 represents a significant shift in conference affiliation[cite: 71]. This move alongside their in-state rival Arizona is part of a larger conference realignment trend in college football[cite: 71, 72].`,
        academics: `Arizona State University is a public research university located in Tempe, Arizona[cite: 72]. It is consistently ranked as one of the most innovative schools in the U.S. News & World Report 2025 rankings place ASU at #105 among National Universities[cite: 72]. In 2022, ASU was ranked #11 among universities worldwide[cite: 72].
        ASU offers a wide variety of academic programs across its colleges and schools, including strong programs in business, engineering, journalism, and sustainability[cite: 72]. The Thunderbird School of Global Management at ASU is ranked #1 in the world for international trade[cite: 72].
        Founded in 1885, Arizona State University has grown into one of the largest universities in the United States, known for its innovation and research output[cite: 72, 73].`,
        coaching: `Kenny Dillingham is the current head coach of the Arizona State Sun Devils, starting his tenure in 2023[cite: 73]. He led the team to a Big 12 Championship in his second season in 2024.
        Prior to Dillingham, Herm Edwards coached the Sun Devils from 2018 to 2022, leading the team to a Las Vegas Bowl victory in 2019[cite: 73]. Todd Graham (2012-2017) and Dennis Erickson (2007-2011) also served as head coaches in recent years[cite: 73].`,
    },
    {
        teamName: "Arkansas Razorbacks",
        history: `The Arkansas Razorbacks football program has a long and storied history, beginning in 1894[cite: 73, 74]. The Razorbacks have an all-time record of 713 wins, 522 losses, and 37 ties[cite: 74]. They were known as the Cardinals until 1909 when they adopted the Razorbacks nickname[cite: 74]. Arkansas was a charter member of the Southwest Conference (SWC) in 1915, winning 13 conference titles before joining the Southeastern Conference (SEC) in 1992[cite: 74]. The program claims one national championship in 1964[cite: 74].
        Arkansas experienced its most significant periods of success under coaches Frank Broyles, who led the Razorbacks to their national championship in 1964 and seven SWC titles, and Lou Holtz, who guided the team to an Orange Bowl victory in 1978 and a share of the SWC title in 1979[cite: 74, 75]. The Razorbacks also had a strong run under Ken Hatfield in the late 1980s, winning consecutive SWC championships in 1988 and 1989[cite: 75].
        Since joining the SEC in 1992, Arkansas has won four SEC West Division titles but has yet to win an overall SEC Championship[cite: 75].
        Over the last 10-15 years (2010-2024), the Arkansas Razorbacks have seen varied performance in the SEC[cite: 75]. They achieved an 11-2 season in 2011 under coach Bobby Petrino, winning the Cotton Bowl[cite: 76]. Bret Bielema led the team to consecutive bowl wins in 2014 and 2015[cite: 76]. Sam Pittman took over as head coach in 2020 and led the Razorbacks to consecutive bowl victories in 2021 and 2022[cite: 76]. The 2024 season concluded with a 7-6 record and a win in the Liberty Bowl[cite: 76].`,
        landscape: `Name, Image, and Likeness (NIL) is an evolving aspect for the Arkansas Razorbacks[cite: 76]. While specific details of the program's NIL strategy are not extensively covered in the provided snippets, it is mentioned that the university has an NIL collective called Arkansas Edge[cite: 77]. The focus on NIL is crucial for attracting and retaining talent in the competitive SEC[cite: 77].
        The expanded College Football Playoff format offers Arkansas a greater opportunity to compete for a national championship[cite: 77]. With 12 teams making the playoff, the Razorbacks could potentially earn a spot through strong regular-season performances and a possible SEC Championship appearance[cite: 78]. The new format increases the chances for SEC teams to reach the playoff[cite: 78].
        Arkansas has been a member of the SEC since 1992, joining after a long history in the Southwest Conference[cite: 78]. The SEC's move to a single-division format in 2024 with the addition of Oklahoma and Texas will alter the conference landscape and scheduling[cite: 78]. Arkansas will face a mix of traditional and new SEC opponents[cite: 78].`,
        academics: `The University of Arkansas is a top-tier public research university located in Fayetteville[cite: 78]. It is ranked among the nation's best public universities by U.S. News & World Report, tying for 96th in the 2025 rankings[cite: 79]. The university is classified as an R1 institution, indicating the highest level of research activity[cite: 79].
        The University of Arkansas offers over 200 academic programs across 10 colleges and schools, including notable programs in business, supply chain management (ranked among the top 10 nationally), engineering, and law[cite: 79]. The university has a strong commitment to research and provides numerous opportunities for students[cite: 79].
        Founded in 1871, the University of Arkansas has a long tradition of academic excellence and is the state's flagship institution[cite: 79, 80].`,
        coaching: `Sam Pittman is the current head coach of the Arkansas Razorbacks, starting his tenure in 2020[cite: 80]. He has led the team to bowl victories in 2021 and 2022[cite: 80].
        Prior to Pittman, Chad Morris (2018-2019) and Bret Bielema (2013-2017) served as head coaches[cite: 80]. Bielema led the Razorbacks to bowl wins in 2014 and 2015[cite: 80]. Bobby Petrino (2008-2011) also had a successful run, including an 11-2 season and a Cotton Bowl victory in 2011[cite: 80]. The program has a history of attracting experienced coaches to lead the team in the competitive SEC[cite: 80].`,
    },
    {
        teamName: "Arkansas State Red Wolves",
        history: `The Arkansas State Red Wolves football program first fielded a team in 1911[cite: 80]. Originally known as the Cardinals, the team adopted the Red Wolves nickname in 2008[cite: 81]. Arkansas State has an all-time record of 503 wins, 530 losses, and 37 ties[cite: 81]. The program has competed in various conferences, including the Arkansas Intercollegiate Conference, the Southland Conference, the Big West Conference, and currently the Sun Belt Conference[cite: 81]. The Red Wolves have claimed 12 conference championships[cite: 81].
        Arkansas State achieved significant success in the Southland Conference, winning multiple championships in the late 1960s and 1970s under coach Bennie Ellender and Bill Davidson[cite: 81]. The program also won consecutive Sun Belt Conference titles from 2011 to 2013 under coaches Hugh Freeze, Gus Malzahn, and Bryan Harsin, and again in 2015 and 2016 under Blake Anderson[cite: 81, 82]. The team claims one national championship at the NCAA College Division level in 1970[cite: 82].
        The Red Wolves briefly played at the Division I-A level from 1978 to 1981[cite: 82].
        Looking at the last 10-15 years (2010-2024), Arkansas State has been a consistent presence in the Sun Belt Conference[cite: 82]. They won conference championships in 2011, 2012, 2013, 2015, and 2016[cite: 83]. The program has also made multiple bowl game appearances during this period, including wins in the 2012 GoDaddy.com Bowl, the 2013 GoDaddy Bowl, the 2016 Cure Bowl, and the 2019 Camellia Bowl[cite: 83]. The 2024 season concluded with an 8-5 record and a victory in the 68 Ventures Bowl[cite: 83].`,
        landscape: `Name, Image, and Likeness (NIL) policies are becoming increasingly important for Arkansas State[cite: 83]. The IMPACKT Club is a NIL collective that provides agreements to Arkansas State athletes, allowing them to benefit from their name, image, and likeness[cite: 84]. Arkansas State Athletics is also working to assist student-athletes in navigating NIL opportunities[cite: 84].
        The expanded College Football Playoff format could offer a path for Arkansas State to compete on a national stage[cite: 84]. As a member of the Sun Belt Conference, the Red Wolves would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 85]. Consistent success within the Sun Belt would be crucial for this opportunity[cite: 85].
        Arkansas State has been a member of the Sun Belt Conference since 1991[cite: 85]. Recent conference realignments have seen Missouri State announce its move to Conference USA in 2025, which will impact Arkansas State's non-conference schedule[cite: 85]. The Sun Belt Conference itself has seen changes in membership in recent years[cite: 85].`,
        academics: `Arkansas State University is classified among "R2: Doctoral Universities – High research activity"[cite: 85]. U.S. News & World Report's 2025 rankings place the university at #342 among National Universities[cite: 86].
        Arkansas State University offers over 150 undergraduate and graduate degree options across six colleges, including notable programs in nursing, education, and business[cite: 86]. The university also has a global reach with a campus in Queretaro, Mexico[cite: 86].
        Founded in 1909, Arkansas State University has grown to become the second-largest university in Arkansas, with a strong focus on both teaching and research[cite: 86].`,
        coaching: `Butch Jones is the current head coach of the Arkansas State Red Wolves, starting his tenure in December 2020[cite: 86]. He led the team to a victory in the 68 Ventures Bowl in 2024[cite: 86, 87].
        Prior to Jones, Blake Anderson served as head coach from 2014 to 2020, leading the Red Wolves to multiple Sun Belt Conference championships and bowl game appearances[cite: 87]. Bryan Harsin and Hugh Freeze also had successful stints as head coaches earlier in the 2010s[cite: 87]. The program has seen a mix of coaching stability and change over the last 10-15 years[cite: 87].`,
    },
    {
        teamName: "Army Black Knights",
        history: `The Army Black Knights football program boasts a long and distinguished history, with its first season in 1890[cite: 87]. Army has an all-time record of 725 wins, 540 losses, and 51 ties[cite: 87]. The program has claimed five national championships, including three consecutive titles from 1944 to 1946 under coach Earl Blaik[cite: 87, 88].
        Army's football team reached its pinnacle of success during World War II, producing two Heisman Trophy winners in Doc Blanchard (1945) and Glenn Davis (1946)[cite: 88]. The program has a strong tradition, particularly in its rivalry games against Navy and Air Force for the Commander-in-Chief's Trophy[cite: 88]. Army has won the Lambert Trophy, awarded to the best college football team in the East, nine times[cite: 88].
        While historically a dominant program, Army has faced periods of challenge in more recent decades as the landscape of college football has evolved[cite: 88, 89].
        Over the last 10-15 years (2010-2024), the Army Black Knights have seen a resurgence under head coach Jeff Monken, who took over in 2014[cite: 89]. Monken has led the Black Knights to multiple winning seasons, including an impressive 12-2 record in 2024, culminating in a win at the Independence Bowl and the program's first conference title as a member of the American Athletic Conference[cite: 89]. The team also had an 11-2 season in 2018 and a 9-3 season in 2020[cite: 89]. Rich Ellerson also coached the team earlier in this period[cite: 89].`,
        landscape: `Name, Image, and Likeness (NIL) policies present a unique situation for Army[cite: 89]. As a service academy, Army athletes are generally not permitted to engage in NIL activities for personal gain[cite: 90]. Their focus remains on their education, military service, and the love of the game[cite: 90]. This stance distinguishes Army from most other FBS programs in the NIL era[cite: 90].
        The expanded College Football Playoff format offers Army a potential path to national championship contention[cite: 90]. As a member of the American Athletic Conference, the Black Knights would have the opportunity to earn an automatic bid as one of the highest-ranked conference champions[cite: 91]. Their recent success, including winning the AAC Championship in 2024, demonstrates their capability to compete for such a bid[cite: 91].
        Army joined the American Athletic Conference (AAC) as a football-only member in 2024[cite: 91]. This move provides the program with a conference affiliation and a clearer path to a potential conference championship and playoff contention[cite: 91]. The annual Army-Navy game will continue to be played as a non-conference rivalry[cite: 91].`,
        academics: `The United States Military Academy at West Point is one of the nation's most prestigious academic institutions, consistently ranking near the top for public colleges[cite: 91]. U.S. News & World Report's 2023-2024 rankings place West Point third in Top Public Liberal Arts Colleges and eighth in Best National Liberal Arts Colleges[cite: 92].
        West Point offers a rigorous academic program with a focus on leadership development and military training[cite: 92]. Cadets receive a Bachelor of Science degree and are commissioned as second lieutenants in the U.S. Army[cite: 92]. The Academy is particularly strong in engineering programs[cite: 92].
        Founded in 1802, the United States Military Academy has a long and storied tradition of academic and leadership excellence, preparing leaders of character for service to the nation[cite: 92, 93].`,
        coaching: `Jeff Monken has been the head coach of the Army Black Knights since December 2013[cite: 93]. He has achieved significant success, leading the team to multiple winning seasons and bowl game victories, including a program-record 12 wins and an AAC Championship in 2024.
        Prior to Monken, Rich Ellerson coached the Black Knights from 2009 to 2013[cite: 93]. Legendary coaches such as Earl Blaik, who led Army to three national championships in the 1940s, have also helmed the program[cite: 93]. The coaching staff at Army is focused on developing leaders of character[cite: 93].`,
    },
    {
        teamName: "Auburn Tigers",
        history: `The Auburn Tigers football program boasts a rich history dating back to 1892, marking the first football game played in the Deep South[cite: 93, 94]. The Tigers have an all-time record of 801 wins, 473 losses, and 47 ties, placing them among the winningest programs in FBS history[cite: 94]. Auburn claims two national championships (1957, 2010) and has won 16 conference championships, including eight in the SEC[cite: 94].
        Auburn's history includes numerous periods of success, particularly under legendary coaches like Shug Jordan and Pat Dye, who led the Tigers to national prominence and conference titles[cite: 94]. The program has also produced three Heisman Trophy winners: Pat Sullivan, Bo Jackson, and Cam Newton[cite: 94, 95]. Auburn has a strong tradition in bowl games, with 24 victories in 47 appearances[cite: 95].
        While a historically strong program, Auburn has also faced periods of inconsistency in recent years[cite: 95].
        Looking at the last 10-15 years (2010-2024), Auburn has experienced both highs and lows[cite: 95]. The 2010 season under coach Gene Chizik was a perfect 14-0, culminating in a BCS National Championship victory[cite: 96]. Gus Malzahn led the Tigers to an SEC Championship and a BCS National Championship appearance in 2013[cite: 96]. However, the program has also had seasons with losing records during this period[cite: 96]. Hugh Freeze took over as head coach in 2023[cite: 97]. The 2024 season concluded with a 5-7 record[cite: 97].`,
        landscape: `Name, Image, and Likeness (NIL) is a significant factor for Auburn[cite: 97]. The university has a collective called On To Victory, which aims to support Auburn student-athletes in their NIL endeavors[cite: 98]. Auburn's athletic director has acknowledged the importance of NIL for the program's sustained success[cite: 98].
        The expanded College Football Playoff format offers Auburn a greater opportunity to compete for a national championship[cite: 98]. As a member of the SEC, a Power Four conference, the Tigers have a clear path to the 12-team playoff through strong regular-season performance and a potential SEC Championship appearance[cite: 99]. Auburn's history of success in high-stakes games positions them as a potential contender in the expanded format[cite: 99].
        Auburn has been a proud member of the Southeastern Conference since its inception in 1932[cite: 99]. The SEC's move to a single-division format in 2024 with the addition of Oklahoma and Texas will create a new scheduling dynamic for the Tigers[cite: 99]. The annual Iron Bowl rivalry game against Alabama remains a cornerstone of their schedule[cite: 99].`,
        academics: `Auburn University is a top-tier public university consistently ranked among the nation's best[cite: 99]. U.S. News & World Report's 2025 rankings place Auburn at #105 among National Universities and #1 in the state of Alabama[cite: 100]. The university is classified as an R1: Doctoral Universities – Very High Research Activity institution[cite: 100].
        Auburn University offers a wide range of academic programs across its colleges, including strong programs in business, engineering, agriculture, and veterinary medicine[cite: 100]. The university is dedicated to providing opportunities for student success[cite: 100].
        Founded in 1856, Auburn University has a long-standing tradition of academic excellence and is committed to its land-grant mission of instruction, research, and outreach[cite: 100, 101].`,
        coaching: `Hugh Freeze was named the head football coach at Auburn on November 28, 2022[cite: 101]. He has a career record of 11-14 at Auburn through the 2024 season[cite: 101].
        Prior to Freeze, Gus Malzahn coached the Tigers from 2013 to 2020, leading them to an SEC Championship and a BCS National Championship appearance in 2013[cite: 102]. Gene Chizik led Auburn to a perfect national championship season in 2010[cite: 102]. Tommy Tuberville also had a successful ten-year tenure from 1999 to 2008[cite: 102]. The program has a history of attracting experienced and successful coaches[cite: 102].`,
    },
     {
        teamName: "Ball State Cardinals",
        history: `The Ball State Cardinals football program has a history dating back to 1924[cite: 102]. The Cardinals compete in the Mid-American Conference (MAC)[cite: 102].
        Ball State's football program has experienced periods of success, including a MAC Championship in 2020[cite: 102].
        The program has also faced periods of struggle, with multiple seasons having losing records[cite: 102, 103].
        Over the last 10-15 years (2010-2024), Ball State has competed in the MAC[cite: 103]. The Cardinals achieved a notable MAC Championship victory in the 2020 season[cite: 104]. They have also had several seasons with winning records, indicating their competitiveness within the conference[cite: 105].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Ball State's ability to attract and retain players[cite: 106]. While the provided snippets do not offer specific information about the program's NIL strategy, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 107]. Ball State is part of the MAC, which is also seeing developments in the NIL space[cite: 107].
        The expanded College Football Playoff format could create new opportunities for Ball State[cite: 107]. As a member of the MAC, the Cardinals would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 108]. Winning the MAC Championship would be crucial for this opportunity[cite: 108].
        Ball State is currently a member of the Mid-American Conference[cite: 108]. Recent conference realignments have seen UMass join the MAC as a full-time member starting in 2025, which could impact scheduling and competitive dynamics within the conference[cite: 108].`,
        academics: `Ball State University is a public university located in Muncie, Indiana[cite: 108]. While the provided snippets do not offer specific academic rankings from sources like U.S. News & World Report, Ball State is generally recognized as a comprehensive university offering a variety of undergraduate and graduate programs[cite: 108, 109]. The university has a history and tradition in academics, providing educational opportunities to students in Indiana and beyond since its founding[cite: 111].`,
        coaching: `The provided snippets do not list the specific head coaches of Ball State over the last 10-15 years[cite: 112]. Further research would be needed to detail the coaching history within the last 10-15 years[cite: 113].`,
    },
    {
        teamName: "Baylor Bears",
        history: `The Baylor Bears football program has a long history, with its first season in 1899[cite: 114]. The Bears compete in the Big 12 Conference[cite: 114].
        Baylor has won 10 conference championships throughout its history, including titles in the Southwest Conference and the Big 12[cite: 114]. The program achieved significant success under coach Art Briles in the early 2010s, winning Big 12 Championships in 2013 and 2014[cite: 114]. The Bears also won the Big 12 Championship in 2021 under coach Dave Aranda[cite: 114].
        Baylor has a mixed bowl game record, with 14 wins and 14 losses in 28 appearances[cite: 114].
        Looking at the last 10-15 years (2010-2024), Baylor experienced a highly successful period under Art Briles, including multiple 10+ win seasons and two Big 12 titles[cite: 114, 115]. Matt Rhule took over in 2017 and led the program to the Sugar Bowl in 2019[cite: 115]. Dave Aranda became head coach in 2020, leading the Bears to a Big 12 Championship and a Sugar Bowl victory in 2021[cite: 115]. The 2024 season concluded with an 8-5 record and an appearance in the Texas Bowl[cite: 115].`,
        landscape: `Name, Image, and Likeness (NIL) is an area of increasing focus for Baylor[cite: 115]. The university has a NIL partner called GXG, which aims to help Baylor student-athletes grow their businesses and personal brands[cite: 116]. Baylor's philosophy emphasizes providing NIL opportunities for all scholarship players[cite: 116].
        The expanded College Football Playoff format enhances Baylor's chances of competing for a national championship[cite: 116]. As a member of the Big 12, a Power Four conference, the Bears have a direct path to the 12-team playoff by winning their conference[cite: 117]. Their recent Big 12 Championship in 2021 demonstrates their capability to reach the playoff under this new format[cite: 117].
        Baylor has been a member of the Big 12 Conference since its formation in 1996, following a long history in the Southwest Conference[cite: 117]. Recent conference realignments have seen Oklahoma and Texas leave the Big 12, while Arizona, Arizona State, Colorado, and Utah have joined, reshaping the conference landscape[cite: 117]. Baylor's schedule will now include matchups against these new Big 12 members[cite: 117, 118].`,
        academics: `Baylor University is a top-tier private university located in Waco, Texas[cite: 118]. It is ranked #91 among National Universities and #47 among private universities in the U.S. News & World Report 2025 rankings[cite: 118]. Baylor holds R1 status as a Doctoral University with Very High Research Activity[cite: 118].
        Baylor offers a wide array of academic programs across its colleges and schools, including the Hankamer School of Business, the Baylor Law School, the Louise Herrington School of Nursing, and the School of Engineering and Computer Science[cite: 118]. The university is particularly known for its business, law, nursing, and science programs, which consistently receive high national rankings[cite: 118, 119].
        Founded in 1845, Baylor University is the oldest continuously operating university in Texas and has a strong tradition of academic excellence grounded in its Christian mission[cite: 119].`,
        coaching: `Dave Aranda is the current head football coach at Baylor, starting his tenure in 2020[cite: 119]. He led the Bears to a Big 12 Championship in 2021.
        Prior to Aranda, Matt Rhule coached Baylor from 2017 to 2019, leading the program to the Sugar Bowl in his final season[cite: 119]. Art Briles had a highly successful run from 2008 to 2015, guiding the Bears to multiple Big 12 Championships[cite: 119]. Grant Teaff also had a long and successful tenure from 1972 to 1992, winning two Southwest Conference titles[cite: 119, 120]. The program has a history of both long-tenured and successful coaching leadership[cite: 120].`,
    },
    {
        teamName: "Boise State Broncos",
        history: `The Boise State Broncos football program, established in 1933, has a remarkable history of success[cite: 120]. The Broncos boast an all-time winning percentage of .727[cite: 120]. The program has won 22 conference championships and two national championships (one at the junior college level and one at the Division I FCS level)[cite: 120]. Boise State holds the longest current streak of winning seasons in FBS, with 27 consecutive years[cite: 120].
        Boise State has achieved numerous undefeated seasons and has a strong record in bowl games, including a notable 3-1 record in the Fiesta Bowl[cite: 120, 121]. The program has consistently punched above its weight, earning a reputation for upsetting higher-ranked opponents[cite: 121].
        Looking at the last 10-15 years (2010-2024), Boise State has continued its winning tradition[cite: 121]. They achieved undefeated seasons in 2009 and 2010 under coach Chris Petersen[cite: 122]. Bryan Harsin led the Broncos to a Fiesta Bowl victory in 2014[cite: 122]. The program has consistently won Mountain West Conference championships and division titles throughout this period[cite: 122]. Spencer Danielson led the team to a Mountain West Championship and a Fiesta Bowl appearance in 2024[cite: 122].`,
        landscape: `Name, Image, and Likeness (NIL) is an evolving landscape for Boise State[cite: 122]. While the program was recognized as having the "Best Institutional NIL Program" in 2022, they acknowledge being behind some Power Four schools in terms of financial resources[cite: 123]. Boise State has launched BroncoPRO to support student-athletes in NIL and revenue-sharing opportunities[cite: 123].
        The expanded College Football Playoff format offers Boise State a clear path to compete for a national championship[cite: 123]. The Broncos are poised to regularly contend for the automatic bid reserved for the highest-ranked Group of 5 conference champion in the 12-team playoff[cite: 124]. Their No. 11 ranking in the CFP in 2024 demonstrates their potential to earn a high seed[cite: 124].
        Boise State accepted an invitation to join the Pac-12 Conference effective July 1, 2026[cite: 124]. This move to a Power Four conference will significantly impact their future schedules, revenue, and recruiting opportunities[cite: 124].`,
        academics: `Boise State University is a public university located in Boise, Idaho[cite: 124]. While specific rankings from U.S. News & World Report were not available in the provided snippets, Boise State is recognized as a comprehensive university offering a wide range of undergraduate and graduate programs[cite: 124, 125].
        Boise State offers nationally accredited programs in health, business, engineering, and education[cite: 125]. The university is home to the Micron Center for Materials Research, indicating strength in STEM fields[cite: 125].
        Founded in 1932, Boise State University has grown into a major institution in Idaho, committed to fostering an intellectual atmosphere and providing diverse academic opportunities[cite: 125].`,
        coaching: `Spencer Danielson is the current head coach of the Boise State Broncos, taking over during the 2023 season and leading them to a Mountain West Championship in 2024[cite: 125].
        Prior to Danielson, Andy Avalos coached the Broncos from 2021 to 2023[cite: 125, 126]. Bryan Harsin (2014-2020) and Chris Petersen (2006-2013) also had highly successful tenures at Boise State, leading the program to numerous conference championships and bowl victories[cite: 126]. The program has a strong history of effective coaching leadership[cite: 126].`,
    },
    {
        teamName: "Boston College Eagles",
        history: `The Boston College Eagles football program has a long history, dating back to 1893[cite: 126]. The Eagles have an all-time record of 535 wins, 429 losses, and 14 ties[cite: 126]. Boston College claims one national championship in 1940 and has won one Big East Conference championship in 2004[cite: 126].
        Boston College has experienced periods of success, including four Eastern championships in the early to mid-20th century and a memorable undefeated season in 1920[cite: 126, 127]. The program has a tradition of playing in bowl games, with 15 wins in 29 appearances[cite: 127].
        The Eagles have also faced periods of struggle, with fluctuations in their win-loss records throughout their history[cite: 127].
        Looking at the last 10-15 years (2010-2024), Boston College has competed in the ACC after joining the conference in 2005[cite: 127]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Eagles have had seasons with winning records and have made multiple bowl game appearances during this timeframe[cite: 127]. The 2024 season concluded with a 7-6 record and an appearance in the Pinstripe Bowl[cite: 127, 128].`,
        landscape: `Name, Image, and Likeness (NIL) is an important aspect for Boston College[cite: 128]. The university has a donor-based NIL collective called "Friends of the Heights" to support its athletes[cite: 129]. Coach Bill O'Brien has emphasized an "earn it" philosophy regarding NIL at Boston College[cite: 129].
        The expanded College Football Playoff format could offer Boston College a greater opportunity to compete for a national championship[cite: 129]. As a member of the ACC, a Power Four conference, the Eagles would have a path to the 12-team playoff by securing a conference championship or earning an at-large bid based on their ranking[cite: 130].
        Boston College has been a member of the ACC since 2005, following a period in the Big East[cite: 130]. Recent conference realignments have seen California, SMU, and Stanford join the ACC for the 2024 season, expanding the league's national footprint[cite: 130].`,
        academics: `Boston College is a highly-regarded private university located in Chestnut Hill, Massachusetts[cite: 130]. U.S. News & World Report's 2025 rankings place Boston College at #37 among national universities[cite: 130]. The university consistently ranks highly in categories such as commitment to undergraduate teaching and best value[cite: 130, 131].
        Boston College offers a wide range of academic programs across its schools and colleges, including the Carroll School of Management, the Connell School of Nursing, and the Morrissey College of Arts and Sciences[cite: 131]. The university is particularly strong in business, nursing, and economics programs[cite: 131].
        Founded in 1863, Boston College has a long tradition of academic excellence as a Jesuit, Catholic university[cite: 131].`,
        coaching: `Bill O'Brien became the head coach of the Boston College Eagles in February 2024[cite: 131]. He brings extensive coaching experience at both the collegiate and NFL levels[cite: 131].
        Prior to O'Brien, Jeff Hafley coached the Eagles from 2020 to 2023[cite: 132]. Steve Addazio (2013-2019) and Frank Spaziani (2009-2012) also served as head coaches in recent years[cite: 132]. The program has seen a few coaching changes over the last decade as it aims to elevate its competitiveness in the ACC[cite: 132].`,
    },
    {
        teamName: "Bowling Green Falcons",
        history: `The Bowling Green Falcons football program has a long history, with its first season in 1919[cite: 132]. The Falcons compete in the Mid-American Conference (MAC)[cite: 132].
        Bowling Green has won 17 conference championships throughout its history, including 12 MAC titles[cite: 132]. The program claimed a UPI national championship in 1959[cite: 132].
        The Falcons have a mixed bowl game record, with 5 wins in 15 appearances[cite: 132, 133].
        Looking at the last 10-15 years (2010-2024), Bowling Green won MAC Championships in 2013 and 2015[cite: 133]. Dino Babers led the team to a 10-3 season in 2015[cite: 133]. Scot Loeffler has been the head coach since 2019[cite: 133]. The 2024 season concluded with a 7-6 record and a loss in the 68 Ventures Bowl[cite: 133].`,
        landscape: `Name, Image, and Likeness (NIL) is an evolving area for Bowling Green[cite: 133]. The university has launched the BGSU Marketplace to help student-athletes connect with NIL opportunities[cite: 134]. The Ziggy Collective also supports Bowling Green student-athletes[cite: 134].
        The expanded College Football Playoff format could offer a path for Bowling Green to compete on a national stage[cite: 134]. As a member of the MAC, the Falcons would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 135]. Winning the MAC Championship would be crucial for this opportunity[cite: 135].
        Bowling Green has been a member of the MAC since 1952[cite: 135]. Recent conference realignments have seen UMass join the MAC as a full-time member starting in 2025[cite: 135]. The MAC has eliminated its East and West divisions starting in 2024[cite: 135].`,
        academics: `Bowling Green State University is ranked among the top public universities in the nation for undergraduate teaching by U.S. News & World Report[cite: 135]. The university is ranked #296 among National Universities in the U.S. News & World Report 2025 rankings[cite: 136].
        Bowling Green offers a variety of academic programs across its colleges, including strong programs in education, business, and health sciences[cite: 136].
        Founded in 1910, Bowling Green State University has a long history of providing quality education in Ohio[cite: 136].`,
        coaching: `Eddie George was hired as the head coach of Bowling Green in 2024[cite: 136].
        Scot Loeffler coached the Falcons from 2019 to 2023, leading them to three straight bowl appearances[cite: 136]. Dino Babers had a successful stint in 2014 and 2015, leading the team to a MAC Championship in 2015[cite: 136]. Dave Clawson also coached the program earlier in the decade[cite: 136, 137].`,
    },
    {
        teamName: "Buffalo Bulls",
        history: `The Buffalo Bulls football program has a history dating back to 1894[cite: 137]. The Bulls compete in the Mid-American Conference (MAC)[cite: 137].
        Buffalo won its first MAC Championship in 2008[cite: 137]. The program also won the Lambert Cup in 1958, recognizing them as the top small college football program in the East[cite: 137].
        The Bulls discontinued their football program for six seasons in the 1970s before reinstating it in 1977[cite: 137].
        Looking at the last 10-15 years (2010-2024), Buffalo won MAC East Division titles in 2018 and 2020[cite: 137]. Lance Leipold had a successful tenure from 2015 to 2020[cite: 137]. The 2024 season under coach Pete Lembo saw the Bulls achieve a 9-4 record and win the Bahamas Bowl[cite: 137, 138].`,
        landscape: `Name, Image, and Likeness (NIL) is an important aspect for Buffalo[cite: 138]. The Nickel City Collective has launched as a NIL collective to support Buffalo student-athletes[cite: 139]. This initiative aims to ensure UB remains competitive in the NIL space[cite: 139].
        The expanded College Football Playoff format could create new opportunities for Buffalo[cite: 139]. As a member of the MAC, the Bulls would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 140]. Winning the MAC Championship would be crucial for this opportunity[cite: 140].
        Buffalo has been a member of the MAC since 1999[cite: 140]. Recent conference realignments have seen UMass join the MAC as a full-time member starting in 2025[cite: 140]. The MAC has eliminated its East and West divisions starting in 2024[cite: 140].`,
        academics: `Further research beyond the provided snippets would be needed to determine Buffalo's specific academic ranking[cite: 140]. The University at Buffalo offers a wide range of academic programs[cite: 141]. Founded in 1846, the University at Buffalo has a long history in the state of New York[cite: 142].`,
        coaching: `Pete Lembo became the head coach of the Buffalo Bulls in 2024[cite: 143].
        Maurice Linguist coached the Bulls from 2021 to 2023[cite: 143]. Lance Leipold had a successful tenure from 2015 to 2020[cite: 143]. Jeff Quinn also coached the program earlier in the decade[cite: 143].`,
    },
    {
        teamName: "BYU Cougars",
        history: `The BYU Cougars football program has a long history, with its first season in 1922[cite: 143]. The Cougars have been independent for a significant portion of their history but have also competed in conferences such as the Western Athletic Conference (WAC) and the Mountain West Conference (MWC)[cite: 143].
        BYU achieved national prominence in 1984 when they completed an undefeated 13-0 season and were crowned national champions[cite: 143, 144]. The Cougars have a tradition of strong offensive play and have produced a Heisman Trophy winner in Ty Detmer (1990)[cite: 144].
        BYU has a solid bowl game record, including several major bowl victories throughout their history[cite: 144].
        Looking at the last 10-15 years (2010-2024), BYU has primarily competed as an independent program[cite: 144]. They have consistently achieved winning seasons and have been ranked in the AP Top 25 on multiple occasions[cite: 145].`,
        landscape: `Name, Image, and Likeness (NIL) policies are playing a significant role at BYU[cite: 145]. The program has a strong and active NIL collective that supports its student-athletes[cite: 146].
        The expanded College Football Playoff format offers BYU a clear path to compete for a national championship[cite: 146]. As a member of the Big 12 Conference starting in 2023, the Cougars have the opportunity to earn an automatic bid to the 12-team playoff by winning their conference[cite: 147].
        BYU joined the Big 12 Conference in 2023, marking a significant conference realignment for the program[cite: 147]. This move places them in a Power Four conference with increased competition and exposure[cite: 147].`,
        academics: `Brigham Young University is a large private university located in Provo, Utah[cite: 147]. While specific rankings from U.S. News & World Report were not available in the provided snippets, BYU is generally recognized as a strong academic institution with a wide range of programs[cite: 147].
        BYU is known for its strong programs in business, engineering, and computer science, among others[cite: 148].
        Founded in 1875, BYU has a long tradition of academic excellence and is affiliated with The Church of Jesus Christ of Latter-day Saints[cite: 149].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the BYU program within the last 10-15 years, including tenures and significant changes in leadership[cite: 150].`,
    },
    {
        teamName: "California Golden Bears",
        history: `The California Golden Bears football program boasts a long and storied history, with its first season in 1882[cite: 151]. The Golden Bears have an all-time record of success, including periods of national prominence in the early 20th century and a Rose Bowl victory in 1938[cite: 151].
        California has a rich tradition in the Pac-12 Conference and its predecessors, winning multiple conference championships throughout its history[cite: 151].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 151].
        Looking at the last 10-15 years (2010-2024), California has competed in the Pac-12 Conference[cite: 151]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Golden Bears have had seasons with bowl game appearances, indicating their competitiveness within the conference[cite: 152].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for California's ability to attract and retain players[cite: 153]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 154].
        The expanded College Football Playoff format could create new opportunities for California[cite: 154]. As a member of the ACC starting in 2024, the Golden Bears would have a path to the 12-team playoff by securing a conference championship or earning an at-large bid based on their ranking[cite: 155].
        California joined the Atlantic Coast Conference (ACC) in 2024, marking a significant conference realignment for the program[cite: 155]. This move ends their long-standing affiliation with the Pac-12 and places them in a conference with new opponents and competitive dynamics[cite: 155].`,
        academics: `The University of California, Berkeley is a highly prestigious public research university consistently ranked among the top academic institutions globally[cite: 155]. U.S. News & World Report consistently ranks UC Berkeley among the top public universities in the United States[cite: 155, 156].
        UC Berkeley offers a wide array of academic programs across various disciplines, renowned for their excellence, particularly in fields like engineering, computer science, and the natural sciences[cite: 156].
        Founded in 1868, UC Berkeley has a long and distinguished history of academic achievement and research innovation[cite: 157].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the California program within the last 10-15 years, including tenures and significant changes in leadership[cite: 158].`,
    },
    {
        teamName: "Central Michigan Chippewas",
        history: `The Central Michigan Chippewas football program has a long history, with its first season in 1896[cite: 159]. The Chippewas compete in the Mid-American Conference (MAC)[cite: 159].
        Central Michigan has won multiple MAC Championships throughout its history, demonstrating a tradition of success within the conference[cite: 159].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 159].
        Looking at the last 10-15 years (2010-2024), Central Michigan has competed in the MAC[cite: 159]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Chippewas have had seasons with winning records and bowl game appearances, indicating their competitiveness within the conference[cite: 160].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Central Michigan's ability to attract and retain players[cite: 161]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 162]. Central Michigan is part of the MAC, which is also seeing developments in the NIL space[cite: 162].
        The expanded College Football Playoff format could create new opportunities for Central Michigan[cite: 162]. As a member of the MAC, the Chippewas would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 163]. Winning the MAC Championship would be crucial for this opportunity[cite: 163].
        Central Michigan is currently a member of the Mid-American Conference[cite: 163]. Recent conference realignments have seen UMass join the MAC as a full-time member starting in 2025, which could impact scheduling and competitive dynamics within the conference[cite: 163].`,
        academics: `Further research beyond the provided snippets would be needed to determine Central Michigan's specific academic ranking[cite: 163]. Central Michigan University offers a wide range of academic programs[cite: 164]. Founded in 1892, Central Michigan University has a long history in the state of Michigan[cite: 165].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Central Michigan program within the last 10-15 years, including tenures and significant changes in leadership[cite: 166].`,
    },
    {
        teamName: "Charlotte 49ers",
        history: `The Charlotte 49ers football program is relatively young, with its first season in 2013[cite: 167]. The 49ers compete in the American Athletic Conference (AAC)[cite: 167].
        The program is still in its early stages of development and has not yet achieved significant historical success in terms of conference championships or major bowl wins[cite: 167].
        Looking at the last 10-15 years (2010-2024), while the program officially started in 2013, the 49ers transitioned to FBS in 2015[cite: 167]. Their performance has been developing, and they are working to establish themselves within the AAC[cite: 167].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an important role for the Charlotte 49ers as they look to build their program[cite: 168]. While specific details about their NIL strategy are not available in the provided snippets, NIL opportunities are becoming a key factor for athletes' decisions[cite: 169]. Charlotte is a member of the AAC, which is also seeing developments in the NIL space[cite: 169].
        The expanded College Football Playoff format could offer a future path for Charlotte[cite: 169]. As a member of the AAC, the 49ers would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 170]. Building a strong program within the AAC will be crucial for this opportunity[cite: 170].
        Charlotte is currently a member of the American Athletic Conference[cite: 170]. Recent conference realignments have seen Army join the AAC as a football-only member in 2024, which could impact the competitive dynamics within the conference[cite: 170].`,
        academics: `Further research beyond the provided snippets would be needed to determine Charlotte's specific academic ranking[cite: 170]. The University of North Carolina at Charlotte offers a wide range of academic programs[cite: 171]. Founded in 1946, UNC Charlotte has grown into a large public university in North Carolina[cite: 172].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Charlotte program within the last 10-15 years, including tenures and significant changes in leadership[cite: 173].`,
    },
    {
        teamName: "Cincinnati Bearcats",
        history: `The Cincinnati Bearcats football program has a long history, with its first season in 1885[cite: 174]. The Bearcats compete in the Big 12 Conference[cite: 174].
        Cincinnati has a history of success, particularly in the last two decades, including multiple conference championships in the MAC, the Big East, and the American Athletic Conference[cite: 174]. The program achieved national recognition with multiple top-25 rankings and bowl game appearances[cite: 174].
        The Bearcats reached the College Football Playoff in 2021, marking a historic achievement for the program[cite: 174].
        Looking at the last 10-15 years (2010-2024), Cincinnati experienced a period of significant success[cite: 174]. They won multiple conference championships in the American Athletic Conference and achieved an undefeated regular season in 2021, earning a spot in the College Football Playoff[cite: 175]. Luke Fickell coached the Bearcats during this successful run before their transition to the Big 12 Conference in 2023[cite: 175]. The 2024 season, their second in the Big 12, concluded with a 6-7 record[cite: 175].`,
        landscape: `Name, Image, and Likeness (NIL) is an important aspect for Cincinnati as they compete in the Big 12. The university has a strong NIL infrastructure to support its student-athletes[cite: 175].
        As a member of the Big 12, a Power Four conference, Cincinnati has a direct path to the expanded College Football Playoff by winning their conference[cite: 175, 176]. Their recent success, including a playoff appearance, positions them as a potential contender in the new format[cite: 176].
        Cincinnati joined the Big 12 Conference in 2023, marking a significant conference realignment for the program[cite: 176]. This move provides them with increased competition and exposure on a national level[cite: 176].`,
        academics: `The University of Cincinnati is a large public research university[cite: 176]. While specific rankings from U.S. News & World Report were not available in the provided snippets, UC is generally recognized as a strong academic institution offering a wide range of programs[cite: 176].
        The University of Cincinnati offers a comprehensive array of academic programs across various disciplines[cite: 177].
        Founded in 1819, the University of Cincinnati has a long history of academic excellence and community engagement[cite: 178].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Cincinnati program within the last 10-15 years, including tenures and significant changes in leadership[cite: 179]. However, Luke Fickell's successful tenure ending in 2022 is a notable point[cite: 180].`,
    },
    {
        teamName: "Clemson Tigers",
        history: `The Clemson Tigers football program is one of the most dominant in recent college football history, with its first season in 1896[cite: 181]. The Tigers have an all-time record of 804 wins, 473 losses, and 44 ties[cite: 181]. Clemson claims three national championships (1981, 2016, 2018) and has won 28 conference titles, including 22 in the ACC[cite: 181].
        Clemson's history is marked by periods of national dominance, particularly under coaches Danny Ford and Dabo Swinney[cite: 181]. The Tigers have had multiple undefeated seasons and boast a high winning percentage[cite: 181]. They have a strong bowl game record and have consistently been ranked among the top teams in the country[cite: 181, 182].
        Over the last 10-15 years (2010-2024), Clemson has been a perennial national championship contender under coach Dabo Swinney[cite: 182]. They won national titles in 2016 and 2018 and appeared in the College Football Playoff multiple times[cite: 183]. The Tigers have also won numerous ACC championships during this period, establishing themselves as the premier program in the conference[cite: 183]. The 2024 season concluded with a 10-4 record and a win in the ACC Championship Game[cite: 183].`,
        landscape: `Clemson is a leader in Name, Image, and Likeness (NIL) opportunities for its student-athletes[cite: 183]. The program has a robust NIL infrastructure to support players in maximizing their brand and earning potential[cite: 184].
        The expanded College Football Playoff format further solidifies Clemson's chances of competing for national championships[cite: 184]. As a consistent top-tier program and ACC champion, the Tigers are expected to be a regular participant in the 12-team playoff, with a high potential for earning first-round byes[cite: 185].
        Clemson has been a long-standing member of the Atlantic Coast Conference (ACC) and is one of its most prominent programs[cite: 185]. Recent conference realignments have seen the addition of California, SMU, and Stanford to the ACC, expanding the league's national reach, though Clemson voted against these additions[cite: 185].`,
        academics: `Clemson University is a highly-regarded public research university located in Clemson, South Carolina[cite: 185]. U.S. News & World Report consistently ranks Clemson among the top public universities in the nation[cite: 185, 186].
        Clemson offers a wide range of academic programs across its colleges, including strong programs in engineering, business, and science[cite: 186].
        Founded in 1889, Clemson University has a strong tradition of academic excellence and is committed to its land-grant mission[cite: 186].`,
        coaching: `Dabo Swinney has been the head coach of the Clemson Tigers since 2008, leading the program to unprecedented success with multiple national championships and ACC titles[cite: 186].
        Prior to Swinney, Danny Ford led Clemson to its first national championship in 1981[cite: 186]. The program has a history of strong and stable coaching leadership[cite: 186].`,
    },
    {
        teamName: "Coastal Carolina Chanticleers",
        history: `The Coastal Carolina Chanticleers football program is relatively young, with its first season in 2003[cite: 186, 187]. The Chanticleers compete in the Sun Belt Conference[cite: 187].
        Coastal Carolina achieved significant success in recent years, particularly under coach Jamey Chadwell, including an undefeated regular season in 2020 and multiple Sun Belt Conference East Division titles[cite: 187].
        The program transitioned to the FBS level in 2017 and has quickly become a competitive force in the Sun Belt[cite: 187].
        Looking at the last 10-15 years (2010-2024), while the program officially started in 2003, the Chanticleers' rise to prominence has been recent[cite: 187]. Their performance in the Sun Belt has been strong, highlighted by their undefeated 2020 season and consistent winning records[cite: 188]. They have also made multiple bowl game appearances[cite: 189].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an important role for Coastal Carolina as they look to maintain their program's success[cite: 189]. While specific details about their NIL strategy are not available in the provided snippets, NIL opportunities are becoming a key factor for athletes' decisions[cite: 190]. Coastal Carolina is a member of the Sun Belt Conference, which is also seeing developments in the NIL space[cite: 190].
        The expanded College Football Playoff format could offer a future path for Coastal Carolina[cite: 190]. As a member of the Sun Belt Conference, the Chanticleers would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 191]. Maintaining their strong performance within the Sun Belt will be crucial for this opportunity[cite: 191].
        Coastal Carolina is currently a member of the Sun Belt Conference[cite: 191]. Recent conference realignments have seen UMass join the MAC, while the Sun Belt has also seen membership changes, impacting the broader FBS landscape[cite: 191].`,
        academics: `Coastal Carolina University is a public university located in Conway, South Carolina[cite: 191]. While the provided snippets do not offer specific academic rankings from sources like U.S. News & World Report, Coastal Carolina is generally recognized as a comprehensive university offering a variety of undergraduate and graduate programs[cite: 191, 192]. The university has a history and tradition in academics, providing educational opportunities to students in South Carolina and beyond since its founding[cite: 194].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Coastal Carolina program within the last 10-15 years, including tenures and significant changes in leadership[cite: 195]. However, Jamey Chadwell's successful tenure is a notable point[cite: 196].`,
    },
    {
        teamName: "Colorado Buffaloes",
        history: `The Colorado Buffaloes football program has a long history, with its first season in 1890[cite: 196]. The Buffaloes compete in the Big 12 Conference[cite: 196].
        Colorado achieved national championship success in 1990 and has a rich history in the Big Eight and Pac-12 conferences, winning multiple conference titles[cite: 196].
        The program has produced a Heisman Trophy winner in Rashaan Salaam (1994) and has a tradition of strong performances, particularly in the 1990s[cite: 196].
        Looking at the last 10-15 years (2010-2024), Colorado competed in the Pac-12 before rejoining the Big 12 in 2024[cite: 196]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Buffaloes have had seasons with bowl game appearances, indicating periods of competitiveness[cite: 197]. The program has experienced coaching changes and is working to rebuild its success[cite: 198].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Colorado[cite: 199]. The program is working to enhance NIL opportunities for its student-athletes[cite: 200].
        As a member of the Big 12, a Power Four conference, Colorado has a path to the expanded College Football Playoff by winning their conference[cite: 200]. The program's recent move back to the Big 12 could also impact their future playoff outlook[cite: 200].
        Colorado rejoined the Big 12 Conference in 2024, marking a significant realignment for the program[cite: 201]. This move ends their affiliation with the Pac-12 and returns them to a conference where they have historical ties[cite: 201].`,
        academics: `The University of Colorado Boulder is a highly-regarded public research university consistently ranked among the top academic institutions nationally[cite: 201]. U.S. News & World Report consistently ranks CU Boulder among the top public universities in the United States[cite: 201].
        CU Boulder offers a wide array of academic programs across various disciplines, renowned for their excellence, particularly in fields like aerospace engineering, environmental science, and journalism[cite: 202].
        Founded in 1876, CU Boulder has a long and distinguished history of academic achievement and research innovation[cite: 203].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Colorado program within the last 10-15 years, including tenures and significant changes in leadership[cite: 204].`,
    },
    {
        teamName: "Colorado State Rams",
        history: `The Colorado State Rams football program has a long history, with its first season in 1890[cite: 205]. The Rams compete in the Mountain West Conference[cite: 205].
        Colorado State has won multiple conference championships throughout its history, demonstrating periods of success within their respective leagues[cite: 205].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 205].
        Looking at the last 10-15 years (2010-2024), Colorado State has competed in the Mountain West Conference[cite: 205]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Rams have had seasons with bowl game appearances, indicating periods of competitiveness within the conference[cite: 206].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Colorado State's ability to attract and retain players[cite: 207]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 208]. Colorado State is a member of the Mountain West Conference, which is also seeing developments in the NIL space[cite: 208].
        The expanded College Football Playoff format could create new opportunities for Colorado State[cite: 208]. As a member of the Mountain West Conference, the Rams would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 209]. Winning the Mountain West Championship would be crucial for this opportunity[cite: 209].
        Colorado State is currently a member of the Mountain West Conference[cite: 209]. Recent conference realignments have seen several Mountain West teams depart for the Pac-12, and there were discussions about Colorado State potentially moving to the American Athletic Conference (AAC), although they ultimately remained in the Mountain West[cite: 209].`,
        academics: `Colorado State University is a public research university located in Fort Collins, Colorado[cite: 209, 210]. While the provided snippets do not offer specific academic rankings from sources like U.S. News & World Report, Colorado State is generally recognized as a comprehensive university offering a variety of undergraduate and graduate programs[cite: 210]. The university has a history and tradition in academics, providing educational opportunities to students in Colorado and beyond since its founding[cite: 212].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Colorado State program within the last 10-15 years, including tenures and significant changes in leadership[cite: 213].`,
    },
    {
        teamName: "Duke Blue Devils",
        history: `The Duke Blue Devils football program has a long history, with its first season in 1888[cite: 214]. The Blue Devils compete in the Atlantic Coast Conference (ACC)[cite: 214].
        Duke has a history of success, particularly in the mid-20th century, and has won multiple conference championships throughout its history[cite: 214].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 214]. However, under coach David Cutcliffe in the 2010s, Duke experienced a resurgence, including multiple bowl game appearances and an ACC Coastal Division title in 2013[cite: 214].
        Looking at the last 10-15 years (2010-2024), Duke competed in the ACC[cite: 214]. Under coach David Cutcliffe, the Blue Devils achieved significant success in the early to mid-2010s, including an ACC Coastal Division title and bowl game victories[cite: 215]. Following Cutcliffe's departure, the program is working to build on that foundation[cite: 216]. The 2024 season concluded with a 7-5 record and a win in the Military Bowl[cite: 217].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Duke's ability to attract and retain players[cite: 217]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 218]. Duke is a member of the ACC, which is also seeing developments in the NIL space[cite: 218].
        The expanded College Football Playoff format could create new opportunities for Duke[cite: 218]. As a member of the ACC, a Power Four conference, the Blue Devils would have a path to the 12-team playoff by securing a conference championship or earning an at-large bid based on their ranking[cite: 219].
        Duke is currently a member of the Atlantic Coast Conference[cite: 219]. Recent conference realignments have seen California, SMU, and Stanford join the ACC for the 2024 season, expanding the league's national footprint[cite: 219].`,
        academics: `Duke University is one of the most prestigious private research universities in the United States, consistently ranking among the top academic institutions globally[cite: 219]. U.S. News & World Report consistently ranks Duke among the top universities in the nation[cite: 219].
        Duke offers a wide array of academic programs across various disciplines, renowned for their excellence, particularly in fields like medicine, law, business, and engineering[cite: 220].
        Founded in 1838, Duke University has a long and distinguished history of academic achievement and research innovation[cite: 221].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Duke program within the last 10-15 years, including tenures and significant changes in leadership[cite: 222]. However, David Cutcliffe's successful tenure is a notable point[cite: 223].`,
    },
    {
        teamName: "East Carolina Pirates",
        history: `The East Carolina Pirates football program has a long history, with its first season in 1932[cite: 223]. The Pirates compete in the American Athletic Conference (AAC)[cite: 223].
        East Carolina has won multiple conference championships throughout its history, demonstrating periods of success within their respective leagues[cite: 223].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 223].
        Looking at the last 10-15 years (2010-2024), East Carolina has competed in the AAC[cite: 223]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Pirates have had seasons with bowl game appearances, indicating periods of competitiveness within the conference[cite: 224].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for East Carolina's ability to attract and retain players[cite: 225]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 226]. East Carolina is a member of the AAC, which is also seeing developments in the NIL space[cite: 226].
        The expanded College Football Playoff format could create new opportunities for East Carolina[cite: 226]. As a member of the AAC, the Pirates would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 227]. Winning the AAC Championship would be crucial for this opportunity[cite: 227].
        East Carolina is currently a member of the American Athletic Conference[cite: 227]. Recent conference realignments have seen Army join the AAC as a football-only member in 2024, which could impact the competitive dynamics within the conference[cite: 227].`,
        academics: `Further research beyond the provided snippets would be needed to determine East Carolina's specific academic ranking[cite: 227]. East Carolina University offers a wide range of academic programs[cite: 228]. Founded in 1907, East Carolina University has a long history in the state of North Carolina[cite: 229].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the East Carolina program within the last 10-15 years, including tenures and significant changes in leadership[cite: 230].`,
    },
    {
        teamName: "Eastern Michigan Eagles",
        history: `The Eastern Michigan Eagles football program has a long history, with its first season in 1891[cite: 231]. The Eagles compete in the Mid-American Conference (MAC)[cite: 231].
        Eastern Michigan has won multiple conference championships throughout its history, demonstrating periods of success within their respective leagues[cite: 231].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 231].
        Looking at the last 10-15 years (2010-2024), Eastern Michigan has competed in the MAC[cite: 231]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Eagles have had seasons with bowl game appearances, indicating periods of competitiveness within the conference[cite: 232].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Eastern Michigan's ability to attract and retain players[cite: 233]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 234]. Eastern Michigan is part of the MAC, which is also seeing developments in the NIL space[cite: 234].
        The expanded College Football Playoff format could create new opportunities for Eastern Michigan[cite: 234]. As a member of the MAC, the Eagles would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 235]. Winning the MAC Championship would be crucial for this opportunity[cite: 235].
        Eastern Michigan is currently a member of the Mid-American Conference[cite: 235]. Recent conference realignments have seen UMass join the MAC as a full-time member starting in 2025, which could impact scheduling and competitive dynamics within the conference[cite: 235].`,
        academics: `Further research beyond the provided snippets would be needed to determine Eastern Michigan's specific academic ranking[cite: 235]. Eastern Michigan University offers a wide range of academic programs[cite: 236]. Founded in 1849, Eastern Michigan University has a long history in the state of Michigan[cite: 237].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Eastern Michigan program within the last 10-15 years, including tenures and significant changes in leadership[cite: 238].`,
    },
    {
        teamName: "Florida Atlantic Owls",
        history: `The Florida Atlantic Owls football program is relatively young, with its first season in 2001[cite: 239]. The Owls compete in the American Athletic Conference (AAC)[cite: 239].
        Florida Atlantic has won multiple conference championships throughout its history, including Conference USA titles, demonstrating periods of success within their respective leagues[cite: 239].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 239].
        Looking at the last 10-15 years (2010-2024), Florida Atlantic has competed in Conference USA and now the AAC[cite: 239]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Owls have had seasons with bowl game appearances, indicating periods of competitiveness within their conferences[cite: 240].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Florida Atlantic's ability to attract and retain players[cite: 241]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 242]. Florida Atlantic is a member of the AAC, which is also seeing developments in the NIL space[cite: 242].
        The expanded College Football Playoff format could create new opportunities for Florida Atlantic[cite: 242]. As a member of the AAC, the Owls would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 243]. Winning the AAC Championship would be crucial for this opportunity[cite: 243].
        Florida Atlantic is currently a member of the American Athletic Conference[cite: 243]. Recent conference realignments have seen Army join the AAC as a football-only member in 2024, which could impact the competitive dynamics within the conference[cite: 243].`,
        academics: `Further research beyond the provided snippets would be needed to determine Florida Atlantic's specific academic ranking[cite: 243]. Florida Atlantic University offers a wide range of academic programs[cite: 244]. Founded in 1961, Florida Atlantic University has grown into a large public university in Florida[cite: 245].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Florida Atlantic program within the last 10-15 years, including tenures and significant changes in leadership[cite: 246].`,
    },
    {
        teamName: "FIU Panthers",
        history: `The FIU Panthers football program is relatively young, with its first season in 2002[cite: 247]. The Panthers compete in Conference USA[cite: 247].
        FIU has won a conference championship in its history, demonstrating a period of success within their respective league[cite: 247].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 247].
        Looking at the last 10-15 years (2010-2024), FIU has competed in Conference USA[cite: 247]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Panthers have had seasons with bowl game appearances, indicating periods of competitiveness within the conference[cite: 248].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for FIU's ability to attract and retain players[cite: 249]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 250]. FIU is a member of Conference USA, which is also seeing developments in the NIL space[cite: 250].
        The expanded College Football Playoff format could create new opportunities for FIU[cite: 250]. As a member of Conference USA, the Panthers would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 251]. Winning the Conference USA Championship would be crucial for this opportunity[cite: 251].
        FIU is currently a member of Conference USA[cite: 251]. Recent conference realignments have seen several teams join and leave Conference USA, impacting the competitive dynamics within the conference[cite: 251].`,
        academics: `Further research beyond the provided snippets would be needed to determine FIU's specific academic ranking[cite: 251]. Florida International University offers a wide range of academic programs[cite: 252]. Founded in 1965, FIU has grown into a large public university in Miami, Florida[cite: 253].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the FIU program within the last 10-15 years, including tenures and significant changes in leadership[cite: 254].`,
    },
    {
        teamName: "Florida Gators",
        history: `The Florida Gators football program is one of the most prominent and successful in the SEC, with its first season in 1906[cite: 255]. The Gators boast an all-time record of success, claiming three national championships (1996, 2006, 2008) and numerous SEC titles[cite: 255].
        Florida's history includes periods of national dominance under legendary coaches like Steve Spurrier and Urban Meyer[cite: 255]. The program has produced multiple Heisman Trophy winners and has a strong tradition of competing at the highest level of college football[cite: 255].
        The Gators have a strong bowl game record, including numerous victories in major bowl games[cite: 255].
        Looking at the last 10-15 years (2010-2024), Florida has experienced some fluctuations in performance[cite: 255]. They won SEC East Division titles in 2015 and 2016 but have not reached the same level of national dominance as in previous eras[cite: 256]. The program has gone through several coaching changes in recent years as they strive to return to the top of the SEC[cite: 257]. The 2024 season concluded with a 5-7 record[cite: 257].`,
        landscape: `Florida is a major player in Name, Image, and Likeness (NIL) opportunities for its student-athletes[cite: 257]. The program has strong support from boosters and alumni, facilitating numerous NIL deals[cite: 258].
        As a member of the SEC, a Power Four conference, Florida has a clear path to the expanded College Football Playoff by winning their conference or earning an at-large bid based on their ranking[cite: 258].
        Florida has been a cornerstone member of the Southeastern Conference (SEC) since its formation in 1932[cite: 258]. The conference's move to a single-division format in 2024 with the addition of Oklahoma and Texas will create a new scheduling dynamic for the Gators[cite: 258].`,
        academics: `The University of Florida is a highly-regarded public research university consistently ranked among the top academic institutions nationally[cite: 258]. U.S. News & World Report consistently ranks Florida among the top public universities in the United States[cite: 259].
        Florida offers a wide array of academic programs across various disciplines, renowned for their excellence, particularly in fields like agriculture, medicine, and business[cite: 260].
        Founded in 1853, the University of Florida has a long and distinguished history of academic achievement and research innovation[cite: 261].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Florida program within the last 10-15 years, including tenures and significant changes in leadership[cite: 262]. However, coaches like Urban Meyer and Dan Mullen have led the program during this period[cite: 263].`,
    },
    {
        teamName: "Florida State Seminoles",
        history: `The Florida State Seminoles football program boasts a rich and successful history, with its first season in 1947[cite: 264]. The Seminoles have an all-time record of 583 wins, 291 losses, and 17 ties[cite: 264]. Florida State claims three national championships (1993, 1999, 2013) and has won 19 conference titles, including 16 in the ACC[cite: 264].
        Florida State's history includes periods of national dominance, particularly under legendary coaches Bobby Bowden and Jimbo Fisher[cite: 264]. The Seminoles were the most successful program in the 1990s and have produced three Heisman Trophy winners: Charlie Ward, Chris Weinke, and Jameis Winston[cite: 264]. Florida State has a strong bowl game record, including multiple victories in major bowl games[cite: 264, 265].
        Over the last 10-15 years (2010-2024), Florida State has experienced both highs and lows[cite: 265]. They won a national championship in 2013 under Jimbo Fisher and achieved multiple ACC titles[cite: 266]. However, the program has also faced periods of decline[cite: 266]. Mike Norvell took over as head coach in 2020 and led the Seminoles to an ACC Championship in 2023 and a 13-1 record[cite: 267]. The 2024 season concluded with a 10-4 record and an appearance in the College Football Playoff[cite: 267].`,
        landscape: `Florida State is a major player in Name, Image, and Likeness (NIL) opportunities for its student-athletes[cite: 267]. The program has strong support from boosters and alumni, facilitating numerous NIL deals[cite: 268].
        As a member of the ACC, a Power Four conference, Florida State has a clear path to the expanded College Football Playoff by winning their conference or earning an at-large bid based on their ranking[cite: 268]. Their recent ACC Championship and playoff appearance demonstrate their potential in the new format[cite: 268].
        Florida State has been a member of the Atlantic Coast Conference (ACC) since 1992 and is one of its most prominent programs[cite: 268]. Recent conference realignments have seen California, SMU, and Stanford join the ACC, though Florida State voted against these additions[cite: 268, 269]. There have been discussions about Florida State's long-term commitment to the ACC[cite: 269].`,
        academics: `Florida State University is a large public research university located in Tallahassee, Florida[cite: 269]. U.S. News & World Report consistently ranks Florida State among the top public universities in the nation[cite: 269].
        Florida State offers a wide array of academic programs across its colleges, including strong programs in business, law, and the sciences[cite: 270].
        Founded in 1851, Florida State University has a long and distinguished history of academic excellence and is designated as a preeminent university in the state of Florida[cite: 270].`,
        coaching: `Mike Norvell is the current head football coach at Florida State, starting his tenure in 2020[cite: 270]. He led the Seminoles to an ACC Championship in 2023.
        Prior to Norvell, Jimbo Fisher coached the Seminoles from 2010 to 2017, leading them to a national championship in 2013[cite: 270]. Legendary coach Bobby Bowden led the program for over three decades, from 1976 to 2009, winning two national championships[cite: 270, 271]. The program has a rich history of successful coaching leadership[cite: 271].`,
    },
    {
        teamName: "Fresno State Bulldogs",
        history: `The Fresno State Bulldogs football program has a long history, with its first season in 1921[cite: 271]. The Bulldogs compete in the Mountain West Conference[cite: 271].
        Fresno State has won multiple conference championships throughout its history, demonstrating periods of success within their respective leagues[cite: 271].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 271].
        Looking at the last 10-15 years (2010-2024), Fresno State has competed in the Mountain West Conference[cite: 271]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Bulldogs have had seasons with bowl game appearances and Mountain West Conference titles, indicating periods of competitiveness within the conference[cite: 272].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Fresno State's ability to attract and retain players[cite: 273]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 274]. Fresno State is a member of the Mountain West Conference, which is also seeing developments in the NIL space[cite: 274].
        The expanded College Football Playoff format could create new opportunities for Fresno State[cite: 274]. As a member of the Mountain West Conference, the Bulldogs would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 275]. Winning the Mountain West Championship would be crucial for this opportunity[cite: 275].
        Fresno State is currently a member of the Mountain West Conference[cite: 275]. Recent conference realignments have seen several Mountain West teams depart for the Pac-12, impacting the dynamics of the conference[cite: 275].`,
        academics: `Further research beyond the provided snippets would be needed to determine Fresno State's specific academic ranking[cite: 275]. California State University, Fresno offers a wide range of academic programs[cite: 276]. Founded in 1911, Fresno State has a long history in the state of California[cite: 277].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Fresno State program within the last 10-15 years, including tenures and significant changes in leadership[cite: 278].`,
    },
    {
        teamName: "Georgia Bulldogs",
        history: `The Georgia Bulldogs football program boasts a rich and storied history, with its first season in 1892[cite: 279]. The Bulldogs compete in the Southeastern Conference (SEC)[cite: 279]. Georgia claims four national championships (1942, 1980, 2021, 2022) and has won 17 conference titles, including 15 in the SEC[cite: 279].
        Georgia's history is marked by periods of national dominance, particularly under coaches Wally Butts, Vince Dooley, and Kirby Smart[cite: 279]. The program has produced two Heisman Trophy winners and has a strong tradition of competing at the highest level of college football[cite: 279]. The Bulldogs have a strong bowl game record, including numerous victories in major bowl games[cite: 279, 280].
        Over the last 10-15 years (2010-2024), Georgia has consistently been one of the top programs in the nation[cite: 280]. Under coach Kirby Smart, the Bulldogs won national championships in 2021 and 2022 and have been a regular participant in the College Football Playoff[cite: 281]. The team has also won multiple SEC East Division titles and SEC Championships during this period[cite: 281]. The 2024 season concluded with an 11-2 record and an SEC Championship[cite: 281].`,
        landscape: `Georgia is a national leader in Name, Image, and Likeness (NIL) opportunities for its student-athletes[cite: 281]. The program has strong support from boosters and alumni, facilitating numerous NIL deals[cite: 282].
        As a member of the SEC, a Power Four conference, Georgia has a clear path to the expanded College Football Playoff by winning their conference or earning an at-large bid based on their ranking[cite: 282]. Their consistent top-tier performance makes them a perennial contender in the new format[cite: 282].
        Georgia has been a cornerstone member of the Southeastern Conference (SEC) since its formation in 1932[cite: 282]. The conference's move to a single-division format in 2024 with the addition of Oklahoma and Texas will create a new scheduling dynamic for the Bulldogs[cite: 282]. Their rivalry game against Alabama remains one of the most anticipated matchups in college football[cite: 282, 283].`,
        academics: `The University of Georgia is a highly-regarded public research university consistently ranked among the top academic institutions nationally[cite: 283]. U.S. News & World Report consistently ranks Georgia among the top public universities in the United States[cite: 283].
        Georgia offers a wide array of academic programs across various disciplines, renowned for their excellence, particularly in fields like law, business, and agriculture[cite: 284].
        Founded in 1785, the University of Georgia is one of the oldest public universities in the United States and has a long and distinguished history of academic achievement and research innovation[cite: 284].`,
        coaching: `Kirby Smart has been the head football coach at Georgia since 2016, leading the program to unprecedented success with multiple national championships and SEC titles[cite: 284].
        Prior to Smart, Mark Richt had a successful 15-year tenure, leading the Bulldogs to multiple SEC Championships[cite: 284]. Legendary coach Vince Dooley also led Georgia to a national championship in 1980[cite: 284, 285]. The program has a rich history of strong and stable coaching leadership[cite: 285].`,
    },
    {
        teamName: "Georgia Southern Eagles",
        history: `The Georgia Southern Eagles football program has a strong history, with its first season in 1924[cite: 285]. The Eagles compete in the Sun Belt Conference[cite: 285].
        Georgia Southern achieved significant success at the FCS level, winning six national championships between 1985 and 2000[cite: 285]. This established the program as a dominant force within that subdivision[cite: 285].
        The Eagles transitioned to the FBS level in 2014 and have quickly established themselves as a competitive program in the Sun Belt Conference[cite: 286]. They have secured multiple Sun Belt Conference championships since joining the FBS, demonstrating their ability to compete at the highest level[cite: 286].
        Looking at the last 10-15 years (2010-2024), while the program officially transitioned to FBS in 2014, the Eagles have shown consistent competitiveness in the Sun Belt[cite: 286]. They have had multiple winning seasons and bowl game appearances, indicating their strong presence within the conference[cite: 287].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Georgia Southern's ability to attract and retain players[cite: 288]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 289]. Georgia Southern is a member of the Sun Belt Conference, which is also seeing developments in the NIL space[cite: 289].
        The expanded College Football Playoff format could create new opportunities for Georgia Southern[cite: 289]. As a member of the Sun Belt Conference, the Eagles would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 290]. Consistent success within the Sun Belt would be crucial for this opportunity[cite: 290].
        Georgia Southern is currently a member of the Sun Belt Conference[cite: 290]. Recent conference realignments have seen UMass join the MAC, while the Sun Belt has also seen membership changes, impacting the broader FBS landscape[cite: 290].`,
        academics: `Further research beyond the provided snippets would be needed to determine Georgia Southern's specific academic ranking[cite: 290]. Georgia Southern University offers a wide range of academic programs[cite: 291]. Founded in 1906, Georgia Southern University has a long history in the state of Georgia[cite: 292].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Georgia Southern program within the last 10-15 years, including tenures and significant changes in leadership[cite: 293].`,
    },
    {
        teamName: "Georgia State Panthers",
        history: `The Georgia State Panthers football program is relatively young, with its first season in 2010[cite: 294]. The Panthers compete in the Sun Belt Conference[cite: 294].
        Georgia State achieved its first bowl victory in 2015 and has shown progress in recent years within the Sun Belt Conference[cite: 294].
        The program is still in its early stages of development and has not yet achieved significant historical success in terms of conference championships or major bowl wins[cite: 294].
        Looking at the last 10-15 years (2010-2024), the entire history of the program falls within this timeframe[cite: 294]. The Panthers transitioned to FBS in 2013. Their performance has been developing within the Sun Belt Conference, with increasing competitiveness in recent seasons[cite: 295].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an important role for the Georgia State Panthers as they look to build their program[cite: 296]. While specific details about their NIL strategy are not available in the provided snippets, NIL opportunities are becoming a key factor for athletes' decisions[cite: 297]. Georgia State is a member of the Sun Belt Conference, which is also seeing developments in the NIL space[cite: 297].
        The expanded College Football Playoff format could offer a future path for Georgia State[cite: 297]. As a member of the Sun Belt Conference, the Panthers would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 298]. Building a strong program within the Sun Belt will be crucial for this opportunity[cite: 298].
        Georgia State is currently a member of the Sun Belt Conference[cite: 298]. Recent conference realignments have seen UMass join the MAC, while the Sun Belt has also seen membership changes, impacting the broader FBS landscape[cite: 298].`,
        academics: `Further research beyond the provided snippets would be needed to determine Georgia State's specific academic ranking[cite: 298]. Georgia State University is a large public university located in Atlanta, Georgia[cite: 299]. Founded in 1913, Georgia State University has grown into a major institution in the state of Georgia[cite: 299].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Georgia State program within the last 10-15 years, including tenures and significant changes in leadership[cite: 300].`,
    },
    {
        teamName: "Georgia Tech Yellow Jackets",
        history: `The Georgia Tech Yellow Jackets football program has a long and storied history, with its first season in 1892[cite: 301]. The Yellow Jackets compete in the Atlantic Coast Conference (ACC)[cite: 301].
        Georgia Tech has won multiple national championships and conference championships throughout its history, demonstrating a tradition of success[cite: 301].
        The program has produced multiple All-Americans and has a long-standing rivalry with the University of Georgia[cite: 301].
        Looking at the last 10-15 years (2010-2024), Georgia Tech has competed in the ACC[cite: 301]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Yellow Jackets have had seasons with bowl game appearances, indicating periods of competitiveness within the conference[cite: 302].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Georgia Tech's ability to attract and retain players[cite: 303]. While specific details about the program's NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 304]. Georgia Tech is a member of the ACC, which is also seeing developments in the NIL space[cite: 304].
        The expanded College Football Playoff format could create new opportunities for Georgia Tech[cite: 304]. As a member of the ACC, a Power Four conference, the Yellow Jackets would have a path to the 12-team playoff by securing a conference championship or earning an at-large bid based on their ranking[cite: 305].
        Georgia Tech is currently a member of the Atlantic Coast Conference[cite: 305]. Recent conference realignments have seen California, SMU, and Stanford join the ACC for the 2024 season, expanding the league's national footprint[cite: 305].`,
        academics: `Georgia Institute of Technology is a highly prestigious public research university consistently ranked among the top academic institutions nationally, particularly in engineering, computing, and business[cite: 305]. U.S. News & World Report consistently ranks Georgia Tech among the top public universities in the United States[cite: 305, 306].
        Georgia Tech is renowned for its programs in engineering, computing, business, design, and the sciences, attracting talented students from around the world[cite: 306].
        Founded in 1885, Georgia Tech has a long and distinguished history of academic achievement and research innovation[cite: 307].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Georgia Tech program within the last 10-15 years, including tenures and significant changes in leadership[cite: 308].`,
    },
    {
        teamName: "Hawaii Rainbow Warriors",
        history: `The Hawaii Rainbow Warriors football program has a long history, with its first season in 1909[cite: 309]. The Rainbow Warriors compete in the Mountain West Conference[cite: 309].
        Hawaii has won multiple conference championships throughout its history, demonstrating periods of success within their respective leagues[cite: 309].
        The program has also faced periods of struggle, with fluctuations in its win-loss records over the years[cite: 309].
        Looking at the last 10-15 years (2010-2024), Hawaii has competed in the Mountain West Conference[cite: 309]. While specific year-by-year conference standings would require further dedicated research beyond the provided snippets, the Rainbow Warriors have had seasons with bowl game appearances, indicating periods of competitiveness within the conference[cite: 310].`,
        landscape: `Name, Image, and Likeness (NIL) policies are likely playing an increasingly important role for Hawaii's ability to attract and retain players, especially considering the unique geographical challenges the program faces[cite: 311]. While specific details about their NIL strategy are not available in the provided snippets, the general trend across college football suggests that NIL opportunities are becoming a key factor for athletes' decisions[cite: 312]. Hawaii is a member of the Mountain West Conference, which is also seeing developments in the NIL space[cite: 312].
        The expanded College Football Playoff format could create new opportunities for Hawaii[cite: 312]. As a member of the Mountain West Conference, the Rainbow Warriors would likely need to secure the automatic bid for the highest-ranked Group of 5 conference champion to reach the 12-team playoff[cite: 313]. Winning the Mountain West Championship would be crucial for this opportunity[cite: 313].
        Hawaii is currently a member of the Mountain West Conference[cite: 313]. Recent conference realignments have seen several Mountain West teams depart for the Pac-12, impacting the dynamics of the conference[cite: 313].`,
        academics: `Further research beyond the provided snippets would be needed to determine Hawaii's specific academic ranking[cite: 313]. The University of Hawaiʻi at Mānoa offers a wide range of academic programs[cite: 314]. Founded in 1907, the University of Hawaiʻi at Mānoa has a long history in the state of Hawaii[cite: 315].`,
        coaching: `Further research beyond the provided snippets would be needed to detail the coaching history of the Hawaii program within the last 10-15 years, including tenures and significant changes in leadership[cite: 316].`,
    },
    {
        teamName: "Houston Cougars",
        history: `The Houston Cougars football program has a long history, with its first season in 1946[cite: 317]. The Cougars compete in the Big 12 Conference[cite: 317].
        Houston has won multiple conference championships throughout its history, including titles in the Southwest Conference, Conference USA, and the American Athletic Conference[cite: 317]. The program has a tradition of high-scoring offenses and exciting football[cite: 317].
        Houston achieved national recognition with undefeated seasons and Cotton Bowl victories in the past[cite: 317].`,
        landscape: `(Data for Houston's Current Landscape, including NIL, Playoff Outlook, and Conference status post-2024, is not available in the provided document snippet).`,
        academics: `(Data for University of Houston's Academic Standing is not available in the provided document snippet).`,
        coaching: `(Data for Houston's Coaching History, particularly recent years, is not available in the provided document snippet).`,
    },
  ];

  return (
    <div className="more-history-container">
      <header className="more-history-header">
        <h1>NCAA FBS Team Profiles</h1>
        <p>
          Explore detailed profiles of NCAA Football Bowl Subdivision teams based on the "FBS Team Deep Research" document[cite: 6]. This includes history, current landscape (NIL, Playoff, Conference), academics, and coaching information.
        </p>
      </header>

      <main className="more-history-content">
        {teamsData.map((team, index) => (
          <TeamProfile
            key={index}
            teamName={team.teamName}
            history={team.history}
            landscape={team.landscape}
            academics={team.academics}
            coaching={team.coaching}
          />
        ))}
         {/* Section indicating incompleteness based on provided data */}
         <section className="research-note">
             <h2>Note on Completeness</h2>
             <p>
                 This page includes profiles for all teams covered in the provided "FBS Team Deep Research" document snippet, which extends alphabetically up to Houston. The original document aimed to cover all ~135 FBS teams[cite: 11], but full data for teams beyond Houston was not present in the analyzed text.
             </p>
         </section>
      </main>

      {/* Updated and simplified styles */}
      <style jsx="true">{`
        .more-history-container {
          max-width: 900px;
          margin: 40px auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .more-history-header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }
        .more-history-header h1 {
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 15px;
          color: #2c3e50; /* Darker blue-grey */
        }
        .more-history-header p {
          font-size: 1.1rem; /* Slightly smaller */
          color: #555; /* Darker grey */
          line-height: 1.6;
          max-width: 700px; /* Limit width for readability */
          margin: 0 auto; /* Center the paragraph */
        }

        /* Team Profile Styling */
        .team-profile {
          margin-bottom: 40px; /* Increased spacing */
          padding: 25px; /* Added padding */
          border: 1px solid #e0e0e0; /* Lighter border */
          border-radius: 6px; /* Slightly rounded corners */
          background-color: #f9f9f9; /* Subtle background */
        }
        .team-profile h2 {
          font-size: 2rem; /* Larger team name */
          margin-bottom: 20px; /* More space below title */
          color: #0056b3; /* Adjusted blue color */
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }
        .team-profile h3 {
          font-size: 1.3rem; /* Sub-heading size */
          color: #333;
          margin-top: 15px; /* Space above sub-heading */
          margin-bottom: 8px;
        }
        .team-profile p {
          font-size: 1rem;
          line-height: 1.7; /* Slightly increased line height */
          color: #444;
          margin-bottom: 10px; /* Space below paragraphs */
        }
        /* Styling for the Note section */
        .research-note {
            margin-top: 40px;
            padding: 20px;
            background-color: #fffbe6; /* Light yellow background */
            border: 1px solid #ffe58f; /* Yellow border */
            border-radius: 6px;
            text-align: center;
        }
        .research-note h2 {
            color: #d46b08; /* Orange/brown color */
            margin-bottom: 10px;
        }
        .research-note p {
            color: #595959; /* Dark grey */
            font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default More;