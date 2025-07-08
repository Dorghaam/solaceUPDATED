import WidgetKit
import SwiftUI

// 1. The Timeline Provider: Feeds data and update times to the widget
struct Provider: TimelineProvider {
    // Provides a placeholder view for the widget gallery
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), quote: SharedDataManager.WidgetQuote(id: "placeholder", text: "Heal and grow with affirmations."), userName: "User")
    }

    // Provides the current state of the widget for transient views
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), quote: SharedDataManager.WidgetQuote(id: "snapshot", text: "Your daily moment of solace."), userName: "User")
        completion(entry)
    }

    // Provides a timeline of entries for future widget updates
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        let currentDate = Date()
        
        // Use our SharedDataManager to get the quotes
        guard let dataManager = SharedDataManager.shared else {
            let entry = SimpleEntry(date: currentDate, quote: SharedDataManager.WidgetQuote(id: "error", text: "Open app to configure widget."), userName: "User")
            let timeline = Timeline(entries: [entry], policy: .atEnd)
            completion(timeline)
            return
        }
        
        let quotes = dataManager.loadQuotes()
        let userName = dataManager.loadUserName() ?? "User"
        
        // If no quotes, show a helpful message
        if quotes.isEmpty {
            let entry = SimpleEntry(date: currentDate, quote: SharedDataManager.WidgetQuote(id: "empty", text: "Find your solace in the app."), userName: userName)
            let timeline = Timeline(entries: [entry], policy: .atEnd)
            completion(timeline)
            return
        }

        // Create a timeline entry for each quote, updating every hour
        for (index, quote) in quotes.enumerated() {
            let entryDate = Calendar.current.date(byAdding: .hour, value: index, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, quote: quote, userName: userName)
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

// 2. The Data Model (Entry)
struct SimpleEntry: TimelineEntry {
    let date: Date
    let quote: SharedDataManager.WidgetQuote
    let userName: String
}

// 3. The Widget View (what the user sees)
struct SolaceWidgetEntryView : View {
    var entry: Provider.Entry

    // This environment variable detects if the widget is on the lock screen
    @Environment(\.widgetFamily) var family

    var body: some View {
        // Switch the view based on where it's displayed
        switch family {
        case .accessoryRectangular:
            // A rectangular view for the lock screen, which can show text
            VStack(alignment: .leading, spacing: 1) {
                Text(entry.quote.text)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .lineLimit(3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .widgetURL(URL(string: "solaceapp://widget?id=\(entry.quote.id)&quote=\(entry.quote.text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"))
        
        case .systemSmall:
            // Small home screen widget
            ZStack {
                // Pink gradient background
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 1.0, green: 0.94, blue: 0.96), // #FFF5F7
                        Color(red: 1.0, green: 0.82, blue: 0.86)  // #FFD1DC
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                VStack {
                    Text(entry.quote.text)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(Color(red: 0.29, green: 0.26, blue: 0.25)) // #4B423F
                        .multilineTextAlignment(.center)
                        .lineLimit(nil)
                        .lineSpacing(2)
                        .minimumScaleFactor(0.7)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .widgetURL(URL(string: "solaceapp://widget?id=\(entry.quote.id)&quote=\(entry.quote.text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"))
        
        case .systemMedium:
            // Medium home screen widget
            ZStack {
                // Pink gradient background
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 1.0, green: 0.94, blue: 0.96), // #FFF5F7
                        Color(red: 1.0, green: 0.82, blue: 0.86)  // #FFD1DC
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                VStack {
                    Text(entry.quote.text)
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(Color(red: 0.29, green: 0.26, blue: 0.25)) // #4B423F
                        .multilineTextAlignment(.center)
                        .lineLimit(nil)
                        .minimumScaleFactor(0.6)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .widgetURL(URL(string: "solaceapp://widget?id=\(entry.quote.id)&quote=\(entry.quote.text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"))
        default:
            // Fallback for other widget families
            VStack {
                Text("Solace")
                    .font(.headline)
                Text(entry.quote.text)
                    .font(.body)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .widgetURL(URL(string: "solaceapp://widget?id=\(entry.quote.id)&quote=\(entry.quote.text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"))
        }
    }
}

// 4. The Main Widget Configuration
@main
struct SolaceWidget: Widget {
    let kind: String = "SolaceWidget" // This MUST match the string in WidgetUpdateModule

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SolaceWidgetEntryView(entry: entry)
                .containerBackground(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color(red: 1.0, green: 0.94, blue: 0.96), // #FFF5F7
                            Color(red: 1.0, green: 0.82, blue: 0.86)  // #FFD1DC
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ), for: .widget
                )
        }
        .configurationDisplayName("Solace Affirmations")
        .description("Your daily dose of healing and motivation.")
        // IMPORTANT: Specify which families are supported
        .supportedFamilies([
            .accessoryRectangular,
            .systemSmall,
            .systemMedium
        ])
    }
} 