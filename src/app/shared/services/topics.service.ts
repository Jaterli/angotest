import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TopicsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Cache local para temas
  private mainTopicsCache = signal<string[]>([]);
  private subTopicsCache = new Map<string, string[]>();
  private specificTopicsCache = new Map<string, string[]>();

  getMainTopics(): Observable<string[]> {
    const cached = this.mainTopicsCache();
    if (cached.length > 0) {
      return of(cached);
    }

    return this.http.get<string[]>(`${this.apiUrl}/topics/main`).pipe(
      map(topics => {
        this.mainTopicsCache.set(topics);
        return topics;
      })
    );
  }

  getSubtopics(mainTopic: string): Observable<string[]> {
    if (this.subTopicsCache.has(mainTopic)) {
      return of(this.subTopicsCache.get(mainTopic)!);
    }

    return this.http.get<string[]>(`${this.apiUrl}/topics/${mainTopic}/sub_topics`).pipe(
      map(subTopics => {
        this.subTopicsCache.set(mainTopic, subTopics);
        return subTopics;
      })
    );
  }

  getSpecificTopics(mainTopic: string, subTopic: string): Observable<string[]> {
    const cacheKey = `${mainTopic}|${subTopic}`;
    if (this.specificTopicsCache.has(cacheKey)) {
      return of(this.specificTopicsCache.get(cacheKey)!);
    }

    return this.http.get<string[]>(`${this.apiUrl}/topics/${mainTopic}/${subTopic}/specific_topics`).pipe(
      map(specificTopics => {
        this.specificTopicsCache.set(cacheKey, specificTopics);
        return specificTopics;
      })
    );
  }
}