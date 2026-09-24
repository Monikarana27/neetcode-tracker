import java.util.*;

public class Template_topo {
static List<Integer> order(List<List<Integer>> g) {
    int[] degree=new int[g.size()];
    for(List<Integer> edges:g) for(int v:edges) degree[v]++;
    Deque<Integer> q=new ArrayDeque<>();
    for(int i=0;i<degree.length;i++) if(degree[i]==0) q.add(i);
    List<Integer> out=new ArrayList<>();
    while(!q.isEmpty()) {
        int u=q.remove(); out.add(u);
        for(int v:g.get(u)) if(--degree[v]==0) q.add(v);
    }
    return out.size()==g.size()?out:List.of(); // Empty on cycle.
}
}
