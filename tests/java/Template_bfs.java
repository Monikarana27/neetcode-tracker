import java.util.*;

public class Template_bfs {
static int[] distance(List<List<Integer>> graph,int source) {
    int[] d=new int[graph.size()]; Arrays.fill(d,-1);
    Deque<Integer> q=new ArrayDeque<>(); q.add(source); d[source]=0;
    while(!q.isEmpty()) {
        int u=q.removeFirst();
        for(int v:graph.get(u)) if(d[v]==-1) {
            d[v]=d[u]+1; q.addLast(v); // Mark on discovery.
        }
    }
    return d;
}
}
