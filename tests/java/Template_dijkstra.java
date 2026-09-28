import java.util.*;

public class Template_dijkstra {
static long[] shortest(List<List<int[]>> g,int source) {
    long inf=Long.MAX_VALUE/4; long[] d=new long[g.size()]; Arrays.fill(d,inf);
    PriorityQueue<long[]> q=new PriorityQueue<>((a,b)->Long.compare(a[0],b[0]));
    d[source]=0;q.offer(new long[]{0,source});
    while(!q.isEmpty()) {
        long[] item=q.poll(); int u=(int)item[1];if(item[0]!=d[u])continue;
        for(int[] edge:g.get(u)) {
            int v=edge[0],w=edge[1];if(w<0)throw new IllegalArgumentException();
            if(d[u]+w<d[v]){d[v]=d[u]+w;q.offer(new long[]{d[v],v});}
        }
    }
    return d; // Each edge is {to, nonnegativeWeight}.
}
}
